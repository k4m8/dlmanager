import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()
    console.log('Login attempt for username:', username)

    if (!username) {
      return NextResponse.json(
        { error: 'Имя пользователя обязательно' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { username }
    })

    console.log('Found user:', user)

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Get user teams separately
    const teamMemberships = await db.teamMember.findMany({
      where: { userId: user.id },
      include: {
        team: true
      }
    })

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      teams: teamMemberships.map(tm => ({
        id: tm.team.id,
        name: tm.team.name,
        role: tm.role
      }))
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Ошибка входа' },
      { status: 500 }
    )
  }
}