import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const teams = await db.team.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Add creator info manually
    const teamsWithCreator = await Promise.all(teams.map(async team => {
      const creator = await db.user.findUnique({
        where: { id: team.creatorId },
        select: {
          id: true,
          username: true,
          name: true
        }
      })
      
      return {
        ...team,
        creator
      }
    }))

    return NextResponse.json(teamsWithCreator)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, creatorId } = await request.json()

    if (!name || !creatorId) {
      return NextResponse.json(
        { error: 'Название команды и создатель обязательны' },
        { status: 400 }
      )
    }

    const team = await db.team.create({
      data: {
        name,
        description,
        creatorId,
        members: {
          create: {
            userId: creatorId,
            role: 'admin',
            permissions: 'view,edit,comment'
          }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            name: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  }
}