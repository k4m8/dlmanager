"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Clock, CalendarDays } from 'lucide-react'

interface Task {
  id: string
  title: string
  deadline: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  team: {
    id: string
    name: string
  }
  description?: string
}

function normalizeDate(value: Date | string) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks')
      if (!response.ok) {
        throw new Error('Не удалось загрузить задачи')
      }
      const data = await response.json()
      setTasks(data)
    } catch (err) {
      console.error('Calendar fetch error:', err)
      setError('Ошибка при загрузке задач')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const datesWithTasks = useMemo(() => {
    const set = new Set<number>()
    tasks.forEach(task => set.add(normalizeDate(task.deadline)))
    return set
  }, [tasks])

  const tasksForDate = useMemo(() => {
    const target = normalizeDate(selectedDate)
    return tasks.filter(task => normalizeDate(task.deadline) === target)
  }, [selectedDate, tasks])

  const upcomingTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => normalizeDate(a.deadline) - normalizeDate(b.deadline))
      .slice(0, 5)
  }, [tasks])

  const highlightModifier = useMemo(
    () => ({
      hasTasks: (date: Date) => datesWithTasks.has(normalizeDate(date)),
    }),
    [datesWithTasks]
  )

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Календарь задач</h1>
            <p className="text-sm text-slate-500">Сводка по дедлайнам и ближайшим активностям</p>
          </div>
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              На главную
            </Button>
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-purple-600" />
                Дата {selectedDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
              </CardTitle>
              <Badge variant="outline" className="text-sm">
                {tasksForDate.length} задач
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                modifiers={highlightModifier}
                modifiersClassNames={{
                  hasTasks: 'bg-purple-100 text-purple-900',
                }}
              />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-600">Задачи на этот день</h3>
                {loading ? (
                  <p className="text-sm text-slate-500">Загрузка...</p>
                ) : tasksForDate.length === 0 ? (
                  <p className="text-sm text-slate-500">Нет задач с дедлайном на выбранную дату.</p>
                ) : (
                  <div className="space-y-3">
                    {tasksForDate.map(task => (
                      <div key={task.id} className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-900">{task.title}</p>
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{task.team.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Ближайшие дедлайны
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-slate-500">Загрузка...</p>
              ) : upcomingTasks.length === 0 ? (
                <p className="text-sm text-slate-500">Задачи не найдены.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingTasks.map(task => (
                    <div key={task.id} className="flex items-start justify-between gap-3 border border-slate-200 rounded-lg p-3 bg-white shadow-sm">
                      <div>
                        <p className="font-semibold text-slate-900">{task.title}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-500">{task.team.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">
                          {new Date(task.deadline).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </p>
                        <p className="text-xs text-slate-500">{task.status.replace('_', ' ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
