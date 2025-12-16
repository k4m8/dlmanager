import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, event: any) {
  const { teamId, userId } = event.params as { teamId: string; userId: string }
  try {
    const member = await db.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
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

    if (!member) {
      return NextResponse.json(
        { error: 'Участник не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error('Error fetching team member:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team member' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, event: any) {
  const { teamId, userId } = event.params as { teamId: string; userId: string }
  try {
    const { permissions } = await request.json()

    if (!permissions) {
      return NextResponse.json(
        { error: 'Права обязательны' },
        { status: 400 }
      )
    }

    const updatedMember = await db.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      },
      data: {
        permissions
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
      message: 'Права участника успешно обновлены',
      member: updatedMember
    })
  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    )
  }
}
