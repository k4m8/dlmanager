import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { username, email, name } = await request.json()

    if (!username || !email) {
      return NextResponse.json(
        { error: 'Имя пользователя и email обязательны' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    })

    if (existingUser) {
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: 'Имя пользователя уже занято' },
          { status: 400 }
        )
      }
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: 'Email уже используется' },
          { status: 400 }
        )
      }
    }

    const user = await db.user.create({
      data: {
        username,
        email,
        name
      }
    })

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      teams: []
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Ошибка регистрации' },
      { status: 500 }
    )
  }
}