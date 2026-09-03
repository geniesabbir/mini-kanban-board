import { PrismaClient, Role, Priority } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.task.deleteMany();
  await prisma.column.deleteMany();
  await prisma.boardMember.deleteMany();
  await prisma.board.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 1. Create Users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      passwordHash,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      passwordHash,
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@example.com',
      name: 'Charlie Davis',
      passwordHash,
    },
  });

  console.log('👤 Created demo users: Alice, Bob, Charlie');

  // 2. Create Alice's main board: "Sprint 24 - Product Engineering"
  const sprintBoard = await prisma.board.create({
    data: {
      title: 'Sprint 24 - Product Engineering',
      description: 'Active sprint board for the core engineering deliverables and UX enhancements.',
      ownerId: alice.id,
    },
  });

  // Share with Bob as EDITOR
  await prisma.boardMember.create({
    data: {
      boardId: sprintBoard.id,
      userId: bob.id,
      role: Role.EDITOR,
    },
  });

  // Columns for Sprint Board
  const colTodo = await prisma.column.create({
    data: {
      boardId: sprintBoard.id,
      title: 'To Do',
      order: 0,
    },
  });

  const colInProgress = await prisma.column.create({
    data: {
      boardId: sprintBoard.id,
      title: 'In Progress',
      order: 1,
    },
  });

  const colReview = await prisma.column.create({
    data: {
      boardId: sprintBoard.id,
      title: 'Code Review',
      order: 2,
    },
  });

  const colDone = await prisma.column.create({
    data: {
      boardId: sprintBoard.id,
      title: 'Done',
      order: 3,
    },
  });

  // Tasks in Sprint Board
  await prisma.task.createMany({
    data: [
      {
        columnId: colTodo.id,
        title: 'Design database schema for Kanban boards',
        description: 'Establish relations between users, boards, members, columns, and tasks with cascade deletes.',
        priority: Priority.HIGH,
        order: 0,
      },
      {
        columnId: colTodo.id,
        title: 'Implement Task Movement API with transactional re-ordering',
        description: 'Ensure cross-column and intra-column moves update order indices sequentially without conflicts.',
        priority: Priority.URGENT,
        order: 1,
      },
      {
        columnId: colInProgress.id,
        title: 'Build drag-and-drop Kanban view in Next.js',
        description: 'Provide fluid drag cards, column drops, and optimistic visual updates.',
        priority: Priority.HIGH,
        order: 0,
      },
      {
        columnId: colInProgress.id,
        title: 'Configure JWT Auth and role-based guards',
        description: 'Prevent unauthorized cross-board access and enforce VIEWER read-only restrictions.',
        priority: Priority.MEDIUM,
        order: 1,
      },
      {
        columnId: colReview.id,
        title: 'Add collaborator invitation modal by email',
        description: 'Allow board owner to invite registered users with EDITOR or VIEWER role.',
        priority: Priority.MEDIUM,
        order: 0,
      },
      {
        columnId: colDone.id,
        title: 'Project requirement analysis & planning',
        description: 'Reviewed the full-stack engineering challenge specification PDF and created design.',
        priority: Priority.LOW,
        order: 0,
      },
    ],
  });

  // 3. Create second board: "Q4 Strategic Roadmap"
  const roadmapBoard = await prisma.board.create({
    data: {
      title: 'Q4 Strategic Roadmap',
      description: 'High-level quarterly initiatives and architectural milestones.',
      ownerId: alice.id,
    },
  });

  // Share with Charlie as VIEWER (read-only collaborator)
  await prisma.boardMember.create({
    data: {
      boardId: roadmapBoard.id,
      userId: charlie.id,
      role: Role.VIEWER,
    },
  });

  const colQ1 = await prisma.column.create({
    data: { boardId: roadmapBoard.id, title: 'Backlog', order: 0 },
  });
  const colQ2 = await prisma.column.create({
    data: { boardId: roadmapBoard.id, title: 'Planned', order: 1 },
  });
  const colQ3 = await prisma.column.create({
    data: { boardId: roadmapBoard.id, title: 'Shipped', order: 2 },
  });

  await prisma.task.createMany({
    data: [
      {
        columnId: colQ1.id,
        title: 'Mobile app responsive layout optimization',
        description: 'Ensure smooth touch interactions on iOS and Android viewports.',
        priority: Priority.MEDIUM,
        order: 0,
      },
      {
        columnId: colQ2.id,
        title: 'Multi-region PostgreSQL replication',
        description: 'Evaluate read replicas and connection pooling with PgBouncer.',
        priority: Priority.HIGH,
        order: 0,
      },
      {
        columnId: colQ3.id,
        title: 'Docker Compose orchestration setup',
        description: 'Containerized frontend, backend, and PostgreSQL with single command startup.',
        priority: Priority.LOW,
        order: 0,
      },
    ],
  });

  // 4. Create Bob's private board
  const bobBoard = await prisma.board.create({
    data: {
      title: "Bob's Personal Tasks",
      description: 'Private personal board owned by Bob.',
      ownerId: bob.id,
    },
  });

  const bobColTodo = await prisma.column.create({
    data: { boardId: bobBoard.id, title: 'To Do', order: 0 },
  });
  await prisma.task.create({
    data: {
      columnId: bobColTodo.id,
      title: 'Review pull request from Alice',
      priority: Priority.HIGH,
      order: 0,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('Demo accounts (password: password123):');
  console.log('- alice@example.com (Owner of Sprint 24 & Roadmap)');
  console.log('- bob@example.com (Editor on Sprint 24, Owner of Bob\'s Personal Tasks)');
  console.log('- charlie@example.com (Viewer on Roadmap)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
