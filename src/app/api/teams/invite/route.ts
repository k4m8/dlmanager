import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { teamId, username, inviterId } = await request.json()

    if (!teamId || !username || !inviterId) {
      return NextResponse.json(
        { error: 'ID команды, имя пользователя и ID приглашающего обязательны' },
        { status: 400 }
      )
    }

    // Check if inviter is admin of the team
    const inviterMembership = await db.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: inviterId
        }
      }
    })

    if (!inviterMembership || inviterMembership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Только администраторы могут приглашать пользователей' },
        { status: 403 }
      )
    }

    // Find user to invite
    const userToInvite = await db.user.findUnique({
      where: { username }
    })

    if (!userToInvite) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMembership = await db.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: userToInvite.id
        }
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Пользователь уже является членом команды' },
        { status: 400 }
      )
    }

    // Add user to team
    const membership = await db.teamMember.create({
      data: {
        teamId,
        userId: userToInvite.id,
        role: 'member'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      message: `Пользователь ${username} успешно добавлен в команду`,
      membership
    })
  } catch (error) {
    console.error('Error inviting user:', error)
    return NextResponse.json(
      { error: 'Failed to invite user' },
      { status: 500 }
    )
  }
}