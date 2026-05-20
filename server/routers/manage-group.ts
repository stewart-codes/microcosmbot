import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { procedure, router } from 'server/trpc'
import { prismaClient } from 'prisma'
import { zodStarsContractAddress } from 'libs/stars'
import { bot } from '@microcosms/bot'
import { getDaoDaoContractAndNft } from '@microcosms/bot'
import { fetchDenomExponent } from '@microcosms/bot'
import { updateRuleSchema } from 'server/update-schema'
import { getChainInfo } from '@microcosms/bot'
import { fromBech32 } from 'cosmwasm'

const getGroup = procedure
  .input(z.object({ code: z.string() }))

  .query(async ({ input, ctx }) => {
    if (!input.code) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
    //check code in db

    const codeDb = await prismaClient().manageGroupCode.findFirst({
      where: {
        code: input.code,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        group: {
          include: {
            groupTokenGate: {
              where: {
                active: true,
              },
            },
          },
        },
      },
    })
    if (!codeDb) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
    const adminsCountPromise = prismaClient().groupAdmin.count({
      where: {
        groupId: codeDb.group.id,
      },
    })
    const membersCountPromise = bot.api.getChatMemberCount(codeDb.group.groupId)
    const [adminsCount, membersCount] = await Promise.all([
      adminsCountPromise,
      membersCountPromise,
    ])
    return { ...codeDb, adminsCount, membersCount }
  })

const getRule = procedure
  .input(z.object({ id: z.string().cuid(), code: z.string() }))

  .query(async ({ input, ctx }) => {
    if (!input.code || !input.id) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
    //check code in db

    const codeDb = await prismaClient().manageGroupCode.findFirst({
      where: {
        code: input.code,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        group: {
          include: {
            groupTokenGate: {
              where: {
                active: true,
                id: input.id,
              },
            },
          },
        },
      },
    })
    if (!codeDb) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
    return codeDb
  })

const saveRule = procedure
  .input(
    z.object({
      id: z.string().cuid().optional(),
      code: z.string(),
      updates: updateRuleSchema,
    })
  )

  .mutation(async ({ input, ctx }) => {
    if (!input.code) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }

    if (
      input.updates.maxToken &&
      input.updates.minToken &&
      input.updates.maxToken < input.updates.minToken
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'maxToken must be greater than minToken',
      })
    }

    const codeDb = await prismaClient().manageGroupCode.findFirst({
      where: {
        code: input.code,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        group: {
          include: {
            groupTokenGate: {
              where: {
                active: true,
                id: input.id,
              },
            },
          },
        },
      },
    })
    if (!codeDb) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }

    let exponent: number | null = null

    if (input.updates.ruleType === 'TOKEN_FACTORY') {
      if (!input.updates.tokenFactoryDenom) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'tokenFactoryDenom is required for TOKEN_FACTORY ruleType',
        })
      }
      // fetch the exponent here if it's unknown.
      exponent = await fetchDenomExponent(
        codeDb.group.chainId,
        input.updates.tokenFactoryDenom
      )
      if (typeof exponent !== 'number') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'invalid tokenFactoryDenom',
        })
      }
    }

    const count = await prismaClient().groupTokenGate.count({
      where: {
        group: {
          id: codeDb.group.id,
        },
      },
    })
    if (count >= 15) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Max 15 rules per group',
      })
    }
    if (!input.id) {
      return prismaClient().groupTokenGate.create({
        data: {
          name: input.updates.name,
          minTokens: input.updates.minToken || 1,
          maxTokens: input.updates.maxToken,
          contractAddress:
            'contractAddress' in input.updates
              ? input.updates.contractAddress
              : '',
          tokenFactoryDenom:
            'tokenFactoryDenom' in input.updates
              ? input.updates.tokenFactoryDenom
              : null,
          tokenFactoryExponent: exponent,
          group: {
            connect: {
              id: codeDb.group.id,
            },
          },
          ruleType: input.updates.ruleType,
        },
      })
    }

    return prismaClient().groupTokenGate.update({
      where: {
        id: input.id,
      },
      data: {
        name: input.updates.name,
        minTokens: input.updates.minToken || 1,
        maxTokens: input.updates.maxToken,
        contractAddress:
          'contractAddress' in input.updates
            ? input.updates.contractAddress
            : '',
        tokenFactoryDenom:
          'tokenFactoryDenom' in input.updates
            ? input.updates.tokenFactoryDenom
            : null,
        tokenFactoryExponent: exponent,
        //cannot change the rule type
      },
    })
  })

const deleteRule = procedure
  .input(
    z.object({
      id: z.string().cuid(),
      code: z.string(),
    })
  )

  .mutation(async ({ input, ctx }) => {
    if (!input.code) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
    //check code in db
    const deletedRes = await prismaClient().groupTokenGate.deleteMany({
      where: {
        id: input.id,
        group: {
          manageGroupCodes: {
            some: {
              code: input.code,
              expiresAt: {
                gt: new Date(),
              },
            },
          },
        },
      },
    })
    if (!deletedRes.count) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
  })

const setMatchAny = procedure
  .input(
    z.object({
      matchAny: z.boolean(),
      code: z.string(),
    })
  )

  .mutation(async ({ input, ctx }) => {
    if (!input.code) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
    const updatedRes = await prismaClient().group.updateMany({
      where: {
        manageGroupCodes: {
          some: {
            code: input.code,
            expiresAt: {
              gt: new Date(),
            },
          },
        },
      },
      data: {
        allowMatchAnyRule: input.matchAny,
      },
    })
    if (!updatedRes.count) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
    return true
  })

const setChain = procedure
  .input(
    z.object({
      chainId: z.string(),
      code: z.string(),
    })
  )

  .mutation(async ({ input, ctx }) => {
    if (!input.code) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
    const chainInfo = getChainInfo(input.chainId)
    if (!chainInfo) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'invalid chain' })
    }
    const updatedRes = await prismaClient().group.updateMany({
      where: {
        manageGroupCodes: {
          some: {
            code: input.code,
            expiresAt: {
              gt: new Date(),
            },
          },
        },
      },
      data: {
        chainId: input.chainId,
      },
    })
    if (!updatedRes.count) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
    return true
  })
const getDaoDaoInfo = procedure
  .input(
    z.object({
      code: z.string(),
      contractAddress: zodStarsContractAddress,
    })
  )

  .query(async ({ input, ctx }) => {
    if (!input.contractAddress) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
    const group = await getGroupForCode(input.code)
    if (!group) {
      console.log('group not found', input.code)
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
    // Validate contract address prefix matches the group's chain
    const chainInfo = getChainInfo(group.group.chainId)
    if (!chainInfo) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'invalid chain' })
    }
    const { prefix } = fromBech32(input.contractAddress)
    if (prefix !== chainInfo.bech32Prefix) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `contract address prefix '${prefix}' does not match chain prefix '${chainInfo.bech32Prefix}'`,
      })
    }
    const daodaoinfo = await getDaoDaoContractAndNft(
      group.group.chainId,
      input.contractAddress
    )
    if (!daodaoinfo.ok) {
      return {
        ok: false,
        error: daodaoinfo.error.toString(),
      }
    }
    return { ok: true, daoDaoInfo: daodaoinfo.value }
  })

const getGroupForCode = (code: string) => {
  return prismaClient().manageGroupCode.findFirst({
    where: {
      code,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      group: true,
    },
  })
}
const getDenomInfo = procedure
  .input(
    z.object({
      code: z.string(),
      denom: z.string(),
    })
  )

  .query(async ({ input, ctx }) => {
    if (!input.denom) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
    const group = await getGroupForCode(input.code)
    if (!group) {
      console.log('group not found', input.code)
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
    const denomInfo = await fetchDenomExponent(group.group.chainId, input.denom)
    if (typeof denomInfo !== 'number') {
      return {
        ok: false,
      }
    }
    return { ok: true, exponent: denomInfo }
  })

export const manageGroupRouter = router({
  // Public
  getGroup: getGroup,
  getRule: getRule,
  saveRule: saveRule,
  deleteRule: deleteRule,
  setMatchAny: setMatchAny,
  setChain: setChain,
  getDaoDaoInfo: getDaoDaoInfo,
  getDenomInfo: getDenomInfo,
})
