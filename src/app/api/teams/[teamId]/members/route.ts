import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest, event: any) {
  const { teamId } = event.params as { teamId: string }
  try {
    const { userId, permissions } = await request.json()

    if (!userId || !permissions) {
      return NextResponse.json(
        { error: 'ID пользователя и права обязательны' },
        { status: 400 }
      )
    }

    // Check if the requester is admin of the team
    // For now, we'll assume the requester is admin (in real app, you'd check this)
    
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
        }
      }
    })

    return NextResponse.json({
      message: 'Права пользователя успешно обновлены',
      member: updatedMember
    })
  } catch (error) {
    console.error('Error updating member permissions:', error)
    return NextResponse.json(
      { error: 'Failed to update member permissions' },
      { status: 500 }
    )
  }
}
