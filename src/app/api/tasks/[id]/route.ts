import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await db.task.findUnique({
      where: {
        id: params.id
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

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, description, priority, status, deadline, startDate, teamId, assigneeIds, shiftPriorities } = body

    // Get the current task
    const currentTask = await db.task.findUnique({
      where: { id: params.id }
    })

    if (!currentTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // If completing a task and shiftPriorities is true, shift all higher priority tasks down
    if (status === 'COMPLETED' && currentTask.status !== 'COMPLETED' && shiftPriorities) {
      await db.task.updateMany({
        where: {
          teamId: currentTask.teamId,
          priority: { gt: currentTask.priority },
          status: { not: 'COMPLETED' }
        },
        data: {
          priority: { decrement: 1 }
        }
      })
    }

    const task = await db.task.update({
      where: {
        id: params.id
      },
      data: {
        title,
        description,
        priority,
        status,
        deadline: deadline ? new Date(deadline) : undefined,
        startDate: startDate ? new Date(startDate) : null,
        teamId,
        assignments: assigneeIds ? {
          deleteMany: {},
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

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.task.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}