import { db } from '@/lib/db'

async function main() {
  // Create users
  const admin = await db.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      name: 'Администратор'
    }
  })

  const user1 = await db.user.create({
    data: {
      username: 'developer1',
      email: 'dev1@example.com',
      name: 'Разработчик 1'
    }
  })

  const user2 = await db.user.create({
    data: {
      username: 'developer2',
      email: 'dev2@example.com',
      name: 'Разработчик 2'
    }
  })

  const user3 = await db.user.create({
    data: {
      username: 'designer1',
      email: 'designer1@example.com',
      name: 'Дизайнер 1'
    }
  })

  // Create teams
  const devTeam = await db.team.create({
    data: {
      name: 'Команда разработки',
      description: 'Основная команда разработки продукта',
      creatorId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'admin', permissions: 'view,edit,comment' },
          { userId: user1.id, role: 'member', permissions: 'view,edit' },
          { userId: user2.id, role: 'member', permissions: 'view' }
        ]
      }
    }
  })

  const designTeam = await db.team.create({
    data: {
      name: 'Команда дизайна',
      description: 'Команда UI/UX дизайна',
      creatorId: user3.id,
      members: {
        create: [
          { userId: user3.id, role: 'admin', permissions: 'view,edit,comment' }
        ]
      }
    }
  })

  // Create tasks with different priorities
  await db.task.create({
    data: {
      title: 'Критический баг в системе аутентификации',
      description: 'Пользователи не могут войти в систему при определенных условиях',
      priority: 1,
      status: 'IN_PROGRESS',
      deadline: new Date('2024-12-20'),
      creatorId: admin.id,
      teamId: devTeam.id,
      assignments: {
        create: [
          { userId: user1.id }
        ]
      }
    }
  })

  await db.task.create({
    data: {
      title: 'Оптимизация базы данных',
      description: 'Улучшить производительность запросов к базе данных',
      priority: 2,
      status: 'PENDING',
      deadline: new Date('2024-12-25'),
      creatorId: admin.id,
      teamId: devTeam.id,
      assignments: {
        create: [
          { userId: user2.id }
        ]
      }
    }
  })

  await db.task.create({
    data: {
      title: 'Рефакторинг компонента авторизации',
      description: 'Переписать компонент авторизации с использованием новых практик',
      priority: 3,
      status: 'PENDING',
      deadline: new Date('2024-12-30'),
      creatorId: admin.id,
      teamId: devTeam.id,
      assignments: {
        create: [
          { userId: user1.id }
        ]
      }
    }
  })

  await db.task.create({
    data: {
      title: 'Дизайн новой страницы настроек',
      description: 'Создать макет страницы настроек пользователя',
      priority: 1,
      status: 'PENDING',
      deadline: new Date('2024-12-22'),
      creatorId: user3.id,
      teamId: designTeam.id,
      assignments: {
        create: [
          { userId: user3.id }
        ]
      }
    }
  })

  await db.task.create({
    data: {
      title: 'Обновление гайдлайнов дизайна',
      description: 'Актуализировать дизайн-систему и гайдлайны',
      priority: 2,
      status: 'PENDING',
      deadline: new Date('2025-01-15'),
      creatorId: user3.id,
      teamId: designTeam.id,
      assignments: {
        create: [
          { userId: user3.id }
        ]
      }
    }
  })

  console.log('Database seeded successfully!')
  console.log('Users created:')
  console.log('- admin (Администратор)')
  console.log('- developer1 (Разработчик 1)')
  console.log('- developer2 (Разработчик 2)')
  console.log('- designer1 (Дизайнер 1)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })