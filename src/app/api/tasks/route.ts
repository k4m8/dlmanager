import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const tasks = await db.task.findMany({
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            name: true
          }
        },
        team: true,
        assignments: {
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
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, priority, deadline, startDate, teamId, creatorId, assigneeIds } = body

    if (!title || !deadline || !teamId || !creatorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the next available priority if not specified
    let taskPriority = priority || 1
    if (!priority) {
      const maxPriority = await db.task.aggregate({
        where: { 
          teamId,
          status: { not: 'COMPLETED' }
        },
        _max: { priority: true }
      })
      taskPriority = (maxPriority._max.priority || 0) + 1
    }

    const task = await db.task.create({
      data: {
        title,
        description,
        priority: taskPriority,
        deadline: new Date(deadline),
        startDate: startDate ? new Date(startDate) : null,
        teamId,
        creatorId,
        assignments: assigneeIds && assigneeIds.length > 0 ? {
          create: assigneeIds.map((userId: string) => ({
            userId
          }))
        } : undefined
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            name: true
          }
        },
        team: true,
        assignments: {
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

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}