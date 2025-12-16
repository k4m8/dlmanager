import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()
    console.log('Simple login attempt for username:', username)

    if (!username) {
      return NextResponse.json(
        { error: 'Имя пользователя обязательно' },
        { status: 400 }
      )
    }

    // Try using raw query
    const users = await db.$queryRaw<{
      id: string
      username: string
      email: string
      name: string
    }[]>`SELECT * FROM User WHERE username = ${username}`
    console.log('Raw query result:', users)

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    const user = users[0]

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      teams: []
    })
  } catch (error) {
    console.error('Simple login error:', error)
    return NextResponse.json(
      { error: 'Ошибка входа' },
      { status: 500 }
    )
  }
}
