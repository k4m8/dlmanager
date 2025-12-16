"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { CalendarDays, Clock, Users, AlertCircle, Plus, Filter, Search, LogOut, Settings, UserPlus, Crown } from 'lucide-react'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  description: string
  priority: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  deadline: string
  startDate?: string
  createdAt: string
  updatedAt: string
  creator: {
    id: string
    username: string
    name: string
  }
  team: {
    id: string
    name: string
    description?: string
  }
  assignments: {
    id: string
    user: {
      id: string
      username: string
      name: string
    }
    assignedAt: string
  }[]
}

interface User {
  id: string
  username: string
  name: string
  email: string
}

interface Team {
  id: string
  name: string
  description?: string
  creator: {
    id: string
    username: string
    name: string
  }
  members: {
    id: string
    role: string
    permissions: string
    user: {
      id: string
      username: string
      name: string
    }
  }[]
  _count: {
    tasks: number
  }
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning'
    message: string
  } | null>(null)
  const [user, setUser] = useState<any>(null)
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 1,
    deadline: '',
    assignees: [] as string[],
    team: ''
  })
  
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: ''
  })
  
  const [inviteUsername, setInviteUsername] = useState('')
  const [selectedTeamForInvite, setSelectedTeamForInvite] = useState('')
  const [selectedTeamForManage, setSelectedTeamForManage] = useState<string | null>(null)
  const [memberPermissions, setMemberPermissions] = useState<{[key: string]: string}>({})

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      window.location.href = '/auth'
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      
      try {
        const [tasksRes, teamsRes] = await Promise.all([
          fetch('/api/tasks'),
          fetch('/api/teams')
        ])

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          setTasks(tasksData)
        }
        
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json()
          setTeams(teamsData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setNotification({
          type: 'error',
          message: 'Ошибка загрузки данных'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  useEffect(() => {
    let filtered = tasks

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    if (teamFilter !== 'all') {
      filtered = filtered.filter(task => task.team.id === teamFilter)
    }

    setFilteredTasks(filtered)
  }, [tasks, searchTerm, statusFilter, teamFilter])

  useEffect(() => {
    const checkDeadlines = () => {
      const today = new Date()
      const urgentTasks = tasks.filter(task => {
        if (task.status === 'COMPLETED') return false
        const daysUntilDeadline = getDaysUntilDeadline(task.deadline)
        return daysUntilDeadline <= 3 && daysUntilDeadline >= 0
      })

      const overdueTasks = tasks.filter(task => {
        if (task.status === 'COMPLETED') return false
        const daysUntilDeadline = getDaysUntilDeadline(task.deadline)
        return daysUntilDeadline < 0
      })

      if (overdueTasks.length > 0) {
        setNotification({
          type: 'error',
          message: `У вас ${overdueTasks.length} просроченных задач!`
        })
      } else if (urgentTasks.length > 0) {
        setNotification({
          type: 'warning',
          message: `${urgentTasks.length} задач требуют внимания в ближайшие 3 дня`
        })
      }
    }

    checkDeadlines()
    const interval = setInterval(checkDeadlines, 60000)

    return () => clearInterval(interval)
  }, [tasks])

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'bg-red-100 text-red-800 border-red-200'
    if (priority === 2) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (priority === 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'PENDING': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const canCreateTask = (teamId: string) => {
    if (!user) return false
    const team = teams.find(t => t.id === teamId)
    const membership = team?.members.find(m => m.user.id === user.id)
    
    // Admin can always create tasks
    if (team?.creator.id === user.id || membership?.role === 'admin') {
      return true
    }
    
    // Members need edit permission
    return membership && hasPermission(membership.permissions, 'edit')
  }

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.deadline || !newTask.team) return

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          deadline: newTask.deadline,
          teamId: newTask.team,
          creatorId: user.id,
          assigneeIds: [user.id] // Assign to creator by default
        }),
      })

      if (response.ok) {
        const createdTask = await response.json()
        setTasks([...tasks, createdTask])
        setNewTask({
          title: '',
          description: '',
          priority: 1,
          deadline: '',
          assignees: [],
          team: ''
        })
        setIsCreateDialogOpen(false)
        
        setNotification({
          type: 'success',
          message: 'Задача успешно создана!'
        })
        
        setTimeout(() => setNotification(null), 3000)
      } else {
        throw new Error('Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      setNotification({
        type: 'error',
        message: 'Ошибка при создании задачи'
      })
    }
  }

  const handleCreateTeam = async () => {
    if (!newTeam.name) return

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTeam.name,
          description: newTeam.description,
          creatorId: user.id
        }),
      })

      if (response.ok) {
        const createdTeam = await response.json()
        setTeams([...teams, createdTeam])
        setNewTeam({
          name: '',
          description: ''
        })
        setIsCreateTeamDialogOpen(false)
        
        setNotification({
          type: 'success',
          message: 'Команда успешно создана!'
        })
        
        setTimeout(() => setNotification(null), 3000)
      } else {
        throw new Error('Failed to create team')
      }
    } catch (error) {
      console.error('Error creating team:', error)
      setNotification({
        type: 'error',
        message: 'Ошибка при создании команды'
      })
    }
  }

  const handleInviteUser = async () => {
    if (!inviteUsername || !selectedTeamForInvite) return

    try {
      const response = await fetch('/api/teams/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: selectedTeamForInvite,
          username: inviteUsername,
          inviterId: user.id
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setInviteUsername('')
        setIsInviteDialogOpen(false)
        
        setNotification({
          type: 'success',
          message: result.message
        })
        
        setTimeout(() => setNotification(null), 3000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error)
      }
    } catch (error: any) {
      console.error('Error inviting user:', error)
      setNotification({
        type: 'error',
        message: error.message || 'Ошибка при приглашении пользователя'
      })
    }
  }

  const handleCompleteTask = async (taskId: string, shiftPriorities: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'COMPLETED',
          shiftPriorities
        }),
      })

      if (response.ok) {
        const updatedTask = await response.json()
        setTasks(tasks.map(t => t.id === taskId ? updatedTask : t))
        
        setNotification({
          type: 'success',
          message: 'Задача завершена!'
        })
        
        setTimeout(() => setNotification(null), 3000)
      }
    } catch (error) {
      console.error('Error completing task:', error)
      setNotification({
        type: 'error',
        message: 'Ошибка при завершении задачи'
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    window.location.href = '/auth'
  }

  const hasPermission = (userPermissions: string, requiredPermission: string) => {
    return userPermissions.includes(requiredPermission)
  }

  const getUserPermissions = (teamId: string) => {
    const team = teams.find(t => t.id === teamId)
    if (!team || !user) return ''
    
    const membership = team.members.find(m => m.user.id === user.id)
    return membership?.permissions || ''
  }

  const canViewTask = (task: Task) => {
    const team = teams.find(t => t.id === task.team.id)
    if (!team || !user) return false
    
    const membership = team.members.find(m => m.user.id === user.id)
    if (!membership) return false
    
    if (team.creator.id === user.id || membership.role === 'admin') {
      return true
    }

    return hasPermission(membership.permissions, 'view')
  }

  const updateMemberPermissions = async (teamId: string, userId: string, permissions: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      })

      if (response.ok) {
        setTeams(teams.map(team => 
          team.id === teamId 
            ? {
                ...team,
                members: team.members.map(member =>
                  member.user.id === userId
                    ? { ...member, permissions }
                    : member
                )
              }
            : team
        ))
        
        setNotification({
          type: 'success',
          message: 'Права успешно обновлены!'
        })
        
        setTimeout(() => setNotification(null), 3000)
      } else {
        throw new Error('Failed to update permissions')
      }
    } catch (error) {
      console.error('Error updating permissions:', error)
      setNotification({
        type: 'error',
        message: 'Ошибка при обновлении прав'
      })
    }
  }

  const togglePermission = (teamId: string, userId: string, permission: string) => {
    const currentPermissions = memberPermissions[`${teamId}-${userId}`] || ''
    const permissions = currentPermissions.split(',').filter(p => p.trim())
    
    const newPermissions = permissions.includes(permission)
      ? permissions.filter(p => p !== permission).join(',')
      : [...permissions, permission].join(',')
    
    setMemberPermissions(prev => ({
      ...prev,
      [`${teamId}-${userId}`]: newPermissions
    }))
  }

  const savePermissions = async (teamId: string, userId: string) => {
    const permissions = memberPermissions[`${teamId}-${userId}`] || ''
    await updateMemberPermissions(teamId, userId, permissions)
  }

  const getUserTeams = () => {
    if (!user) return []
    return teams.filter(team => 
      team.creator.id === user.id || 
      team.members.some(member => member.user.id === user.id)
    )
  }

  const getAdminTeams = () => {
    if (!user) return []
    return getUserTeams().filter(team => 
      team.creator.id === user.id || 
      team.members.some(member => member.user.id === user.id && member.role === 'admin')
    )
  }

  const getTeamsWithManageAccess = () => {
    if (!user) return []
    return getUserTeams().filter(team => 
      team.creator.id === user.id || 
      team.members.some(member => member.user.id === user.id && member.role === 'admin')
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  const userTeams = getUserTeams()
  const adminTeams = getAdminTeams()

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-yellow-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Система управления задачами</h1>
            <p className="text-gray-600">Добро пожаловать, {user?.name || user?.username}!</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/calendar">
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Календарь
              </Button>
            </Link>
            
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Выйти
            </Button>
          </div>
        </div>

        {/* User Teams */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Мои команды</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userTeams.map(team => {
              const membership = team.members.find(m => m.user.id === user.id)
              const isAdmin = team.creator.id === user.id || 
                           membership?.role === 'admin'
              const canManageMembers = isAdmin
              
              return (
                <Card key={team.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      {isAdmin && (
                        <Badge className="bg-purple-100 text-purple-800">
                          <Crown className="h-3 w-3 mr-1" />
                          Админ
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      {team.description || 'Нет описания'}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{team._count.tasks} задач</span>
                      <span>{team.members.length + 1} участников</span>
                    </div>
                    
                    {isAdmin && (
                      <div className="mt-3 flex gap-2">
                        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedTeamForInvite(team.id)}
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Пригласить
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Пригласить пользователя в команду</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="invite-username">Имя пользователя</Label>
                                <Input
                                  id="invite-username"
                                  value={inviteUsername}
                                  onChange={(e) => setInviteUsername(e.target.value)}
                                  placeholder="Введите имя пользователя для приглашения"
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                                  Отмена
                                </Button>
                                <Button onClick={handleInviteUser}>
                                  Пригласить
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={selectedTeamForManage === team.id} onOpenChange={(open) => !open && setSelectedTeamForManage(null)}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedTeamForManage(team.id)}
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              Управление
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Управление командой: {team.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <h3 className="text-lg font-medium">Участники команды</h3>
                                <div className="space-y-2">
                                  {team.members.map(member => {
                                    const currentPermissions = memberPermissions[`${team.id}-${member.user.id}`] || member.permissions
                                    const permissions = currentPermissions.split(',').filter(p => p.trim())
                                    
                                    return (
                                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center space-x-3">
                                          <div>
                                            <div className="font-medium">{member.user.name || member.user.username}</div>
                                            <div className="text-sm text-gray-500">{member.user.username}</div>
                                          </div>
                                          <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                                            {member.role === 'admin' ? 'Администратор' : 'Участник'}
                                          </Badge>
                                        </div>
                                        
                                        {member.user.id !== user.id && isAdmin && (
                                          <div className="flex items-center space-x-2">
                                            <Label className="text-sm">Просмотр:</Label>
                                            <Checkbox
                                              checked={permissions.includes('view')}
                                              onCheckedChange={() => togglePermission(team.id, member.user.id, 'view')}
                                              disabled={member.role === 'admin'}
                                            />
                                            
                                            <Label className="text-sm">Редакт.:</Label>
                                            <Checkbox
                                              checked={permissions.includes('edit')}
                                              onCheckedChange={() => togglePermission(team.id, member.user.id, 'edit')}
                                              disabled={member.role === 'admin'}
                                            />
                                            
                                            <Label className="text-sm">Коммент.:</Label>
                                            <Checkbox
                                              checked={permissions.includes('comment')}
                                              onCheckedChange={() => togglePermission(team.id, member.user.id, 'comment')}
                                              disabled={member.role === 'admin'}
                                            />
                                            
                                            <Button
                                              size="sm"
                                              onClick={() => savePermissions(team.id, member.user.id)}
                                              disabled={member.role === 'admin'}
                                            >
                                              Сохранить
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
            
            <Card className="flex items-center justify-center min-h-[150px] border-dashed">
              <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="h-full w-full">
                    <Plus className="h-8 w-8 mb-2" />
                    <div>Создать команду</div>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Создать новую команду</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="team-name">Название команды</Label>
                      <Input
                        id="team-name"
                        value={newTeam.name}
                        onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Введите название команды"
                      />
                    </div>
                    <div>
                      <Label htmlFor="team-description">Описание</Label>
                      <Textarea
                        id="team-description"
                        value={newTeam.description}
                        onChange={(e) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Введите описание команды"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateTeamDialogOpen(false)}>
                        Отмена
                      </Button>
                      <Button onClick={handleCreateTeam}>
                        Создать команду
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </Card>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Активные задачи</p>
                  <p className="text-2xl font-bold">{tasks.filter(t => t.status !== 'COMPLETED').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Приоритет 1</p>
                  <p className="text-2xl font-bold">{tasks.filter(t => t.priority === 1).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Команды</p>
                  <p className="text-2xl font-bold">{userTeams.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Дедлайны на неделе</p>
                  <p className="text-2xl font-bold">
                    {tasks.filter(t => {
                      const days = getDaysUntilDeadline(t.deadline)
                      return days >= 0 && days <= 7
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск задач..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="PENDING">Ожидает</SelectItem>
                  <SelectItem value="IN_PROGRESS">В работе</SelectItem>
                  <SelectItem value="COMPLETED">Завершено</SelectItem>
                </SelectContent>
              </Select>

              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Команда" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все команды</SelectItem>
                  {userTeams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {adminTeams.length > 0 && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Новая задача
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Создать новую задачу</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Название задачи</Label>
                      <Input
                        id="title"
                        value={newTask.title}
                        onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Введите название задачи"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Описание</Label>
                      <Textarea
                        id="description"
                        value={newTask.description}
                        onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Подробное описание задачи"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="priority">Приоритет</Label>
                        <Select value={newTask.priority.toString()} onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: parseInt(value) }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 (самый высокий)</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="deadline">Дедлайн</Label>
                        <Input
                          id="deadline"
                          type="date"
                          value={newTask.deadline}
                          onChange={(e) => setNewTask(prev => ({ ...prev, deadline: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="team">Команда</Label>
                      <Select value={newTask.team} onValueChange={(value) => setNewTask(prev => ({ ...prev, team: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите команду" />
                        </SelectTrigger>
                        <SelectContent>
                          {adminTeams.map(team => (
                            <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Отмена
                      </Button>
                      <Button onClick={handleCreateTask}>
                        Создать задачу
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTasks.filter(task => canViewTask(task)).map(task => {
            const daysUntilDeadline = getDaysUntilDeadline(task.deadline)
            const isOverdue = daysUntilDeadline < 0
            const isUrgent = daysUntilDeadline <= 3 && daysUntilDeadline >= 0
            const canComplete = task.team.id && userTeams.some(t => t.id === task.team.id)

            return (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">{task.title}</CardTitle>
                    <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                      #{task.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {task.team.name}
                    </Badge>
                    <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                      {task.status === 'COMPLETED' ? 'Завершено' : task.status === 'IN_PROGRESS' ? 'В работе' : 'Ожидает'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{task.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CalendarDays className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {new Date(task.deadline).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <Badge 
                        variant={isOverdue ? "destructive" : isUrgent ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {isOverdue ? `Просрочено (${Math.abs(daysUntilDeadline)} дн.)` : 
                         isUrgent ? `${daysUntilDeadline} дн.` : 
                         `${daysUntilDeadline} дн.`}
                      </Badge>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Исполнители:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {task.assignments.map((assignment) => (
                          <Badge key={assignment.id} variant="secondary" className="text-xs">
                            {assignment.user.name || assignment.user.username}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {task.status !== 'COMPLETED' && canComplete && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center space-x-2 mb-2">
                          <Checkbox id={`shift-${task.id}`} />
                          <Label htmlFor={`shift-${task.id}`} className="text-sm">
                            Сместить приоритеты при завершении
                          </Label>
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            const checkbox = document.getElementById(`shift-${task.id}`) as HTMLInputElement
                            handleCompleteTask(task.id, checkbox?.checked || false)
                          }}
                        >
                          Завершить задачу
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Задачи не найдены</h3>
            <p className="text-gray-600">Попробуйте изменить параметры фильтрации или поиска</p>
          </div>
        )}
      </div>
    </div>
  )
}
