// lib/mcq-bank.ts
export interface MCQuestion {
  id: string
  domain: string
  topic: string
  difficulty: "easy" | "medium" | "hard"
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  timeLimit: number // seconds
}

export const MCQ_BANK: MCQuestion[] = [
  // ── JAVA ──
  {
    id: "java_001", domain: "Java", topic: "OOP", difficulty: "easy",
    question: "Which keyword is used to inherit a class in Java?",
    options: ["implements", "extends", "inherits", "super"],
    correctIndex: 1,
    explanation: "'extends' is used for class inheritance in Java. 'implements' is used for interfaces.",
    timeLimit: 30,
  },
  {
    id: "java_002", domain: "Java", topic: "OOP", difficulty: "medium",
    question: "What is the output of: System.out.println(10 + 20 + \"Hello\")?",
    options: ["10 20 Hello", "30Hello", "1020Hello", "Compile Error"],
    correctIndex: 1,
    explanation: "Java evaluates left to right. 10+20=30, then 30+\"Hello\"=\"30Hello\".",
    timeLimit: 45,
  },
  {
    id: "java_003", domain: "Java", topic: "Collections", difficulty: "medium",
    question: "Which collection does NOT allow duplicate elements?",
    options: ["ArrayList", "LinkedList", "HashSet", "Vector"],
    correctIndex: 2,
    explanation: "HashSet implements Set interface which does not allow duplicates.",
    timeLimit: 30,
  },
  {
    id: "java_004", domain: "Java", topic: "Multithreading", difficulty: "hard",
    question: "Which method is used to make a thread wait until another thread completes?",
    options: ["wait()", "sleep()", "join()", "yield()"],
    correctIndex: 2,
    explanation: "join() makes the current thread wait until the thread it's called on finishes execution.",
    timeLimit: 45,
  },
  // ── PYTHON ──
  {
    id: "py_001", domain: "Python", topic: "Basics", difficulty: "easy",
    question: "Which of these is used to define a function in Python?",
    options: ["func", "define", "def", "function"],
    correctIndex: 2,
    explanation: "'def' keyword is used to define functions in Python.",
    timeLimit: 20,
  },
  {
    id: "py_002", domain: "Python", topic: "Data Structures", difficulty: "medium",
    question: "What is the time complexity of searching in a Python dictionary?",
    options: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
    correctIndex: 2,
    explanation: "Python dictionaries use hash tables, giving O(1) average-case lookup time.",
    timeLimit: 40,
  },
  {
    id: "py_003", domain: "Python", topic: "OOP", difficulty: "medium",
    question: "What does @staticmethod decorator do in Python?",
    options: [
      "Creates a method that accesses class variables",
      "Creates a method that doesn't need self or cls",
      "Makes a method private",
      "Creates an abstract method"
    ],
    correctIndex: 1,
    explanation: "@staticmethod creates a method that doesn't receive the instance or class as first argument.",
    timeLimit: 40,
  },
  // ── DSA ──
  {
    id: "dsa_001", domain: "DSA", topic: "Arrays", difficulty: "easy",
    question: "What is the time complexity of binary search?",
    options: ["O(n)", "O(n log n)", "O(log n)", "O(1)"],
    correctIndex: 2,
    explanation: "Binary search divides the array in half each step, giving O(log n) time complexity.",
    timeLimit: 30,
  },
  {
    id: "dsa_002", domain: "DSA", topic: "Linked List", difficulty: "medium",
    question: "Which operation is O(1) in a singly linked list?",
    options: ["Search", "Insert at end", "Insert at beginning", "Delete from middle"],
    correctIndex: 2,
    explanation: "Inserting at beginning requires only updating the head pointer — O(1) operation.",
    timeLimit: 35,
  },
  {
    id: "dsa_003", domain: "DSA", topic: "Trees", difficulty: "hard",
    question: "In a Binary Search Tree, which traversal gives sorted output?",
    options: ["Pre-order", "Post-order", "In-order", "Level-order"],
    correctIndex: 2,
    explanation: "In-order traversal (left → root → right) of a BST produces elements in sorted order.",
    timeLimit: 40,
  },
  {
    id: "dsa_004", domain: "DSA", topic: "Graphs", difficulty: "hard",
    question: "Which algorithm is used to find the shortest path in an unweighted graph?",
    options: ["DFS", "BFS", "Dijkstra", "Bellman-Ford"],
    correctIndex: 1,
    explanation: "BFS finds the shortest path in an unweighted graph by exploring nodes level by level.",
    timeLimit: 45,
  },
  // ── DBMS ──
  {
    id: "dbms_001", domain: "DBMS", topic: "SQL", difficulty: "easy",
    question: "Which SQL command is used to retrieve data from a database?",
    options: ["GET", "FETCH", "SELECT", "RETRIEVE"],
    correctIndex: 2,
    explanation: "SELECT is the standard SQL command for querying/retrieving data from tables.",
    timeLimit: 20,
  },
  {
    id: "dbms_002", domain: "DBMS", topic: "Normalization", difficulty: "medium",
    question: "A table is in 3NF if it is in 2NF and has no:",
    options: [
      "Partial dependencies",
      "Transitive dependencies",
      "Multi-valued dependencies",
      "Functional dependencies"
    ],
    correctIndex: 1,
    explanation: "3NF eliminates transitive dependencies (non-key attributes depending on other non-key attributes).",
    timeLimit: 45,
  },
  {
    id: "dbms_003", domain: "DBMS", topic: "Indexes", difficulty: "hard",
    question: "Which type of index is automatically created on a PRIMARY KEY column?",
    options: ["Bitmap index", "Composite index", "Clustered index", "Non-clustered index"],
    correctIndex: 2,
    explanation: "A clustered index is automatically created for PRIMARY KEY, determining physical data order.",
    timeLimit: 45,
  },
  // ── OS ──
  {
    id: "os_001", domain: "OS", topic: "Processes", difficulty: "easy",
    question: "What does CPU scheduling algorithm 'FCFS' stand for?",
    options: [
      "First Come First Served",
      "First Core First Scheduled",
      "Fastest CPU First Scheduled",
      "First Cache First Served"
    ],
    correctIndex: 0,
    explanation: "FCFS (First Come First Served) processes jobs in the order they arrive in the ready queue.",
    timeLimit: 25,
  },
  {
    id: "os_002", domain: "OS", topic: "Deadlock", difficulty: "medium",
    question: "Which condition is NOT required for a deadlock to occur?",
    options: ["Mutual exclusion", "Preemption", "Hold and wait", "Circular wait"],
    correctIndex: 1,
    explanation: "Preemption (ability to forcibly take resources) PREVENTS deadlock. The 4 necessary conditions are: mutual exclusion, hold-and-wait, no preemption, circular wait.",
    timeLimit: 45,
  },
  // ── NETWORKING ──
  {
    id: "net_001", domain: "Networks", topic: "Protocols", difficulty: "easy",
    question: "Which protocol is used to assign IP addresses automatically?",
    options: ["DNS", "DHCP", "FTP", "SMTP"],
    correctIndex: 1,
    explanation: "DHCP (Dynamic Host Configuration Protocol) automatically assigns IP addresses to devices.",
    timeLimit: 25,
  },
  {
    id: "net_002", domain: "Networks", topic: "OSI Model", difficulty: "medium",
    question: "At which OSI layer does routing occur?",
    options: ["Layer 1 (Physical)", "Layer 2 (Data Link)", "Layer 3 (Network)", "Layer 4 (Transport)"],
    correctIndex: 2,
    explanation: "Routing occurs at Layer 3 (Network layer). Routers operate at this layer using IP addresses.",
    timeLimit: 35,
  },
  // ── APTITUDE ──
  {
    id: "apt_001", domain: "Aptitude", topic: "Quantitative", difficulty: "easy",
    question: "If a train travels 360 km in 4 hours, what is its speed in m/s?",
    options: ["25 m/s", "90 m/s", "100 m/s", "36 m/s"],
    correctIndex: 0,
    explanation: "Speed = 360/4 = 90 km/h. Convert: 90 × (1000/3600) = 25 m/s.",
    timeLimit: 60,
  },
  {
    id: "apt_002", domain: "Aptitude", topic: "Logical", difficulty: "medium",
    question: "Find the next number in the series: 2, 6, 12, 20, 30, ?",
    options: ["40", "42", "44", "38"],
    correctIndex: 1,
    explanation: "Differences are 4, 6, 8, 10, 12. Next = 30 + 12 = 42.",
    timeLimit: 60,
  },
  {
    id: "apt_003", domain: "Aptitude", topic: "Verbal", difficulty: "easy",
    question: "Choose the word most similar in meaning to 'ELOQUENT':",
    options: ["Silent", "Fluent", "Awkward", "Confused"],
    correctIndex: 1,
    explanation: "Eloquent means well-spoken or fluent. It refers to someone who expresses ideas clearly and effectively.",
    timeLimit: 30,
  },
  {
    id: "apt_004", domain: "Aptitude", topic: "Quantitative", difficulty: "hard",
    question: "A can do a work in 15 days, B in 20 days. If they work together for 4 days, what fraction of work remains?",
    options: ["8/15", "7/15", "1/2", "2/5"],
    correctIndex: 0,
    explanation: "A+B per day = 1/15 + 1/20 = 7/60. In 4 days: 28/60 = 7/15 done. Remaining = 1 - 7/15 = 8/15.",
    timeLimit: 90,
  },
  // ── CLOUD ──
  {
    id: "cloud_001", domain: "Cloud", topic: "AWS", difficulty: "medium",
    question: "Which AWS service is used for object storage?",
    options: ["EC2", "RDS", "S3", "Lambda"],
    correctIndex: 2,
    explanation: "Amazon S3 (Simple Storage Service) provides scalable object storage for files, images, backups etc.",
    timeLimit: 30,
  },
  {
    id: "cloud_002", domain: "Cloud", topic: "Concepts", difficulty: "easy",
    question: "What does 'IaaS' stand for in cloud computing?",
    options: [
      "Internet as a Service",
      "Infrastructure as a Service",
      "Integration as a Service",
      "Information as a Service"
    ],
    correctIndex: 1,
    explanation: "IaaS (Infrastructure as a Service) provides virtualized computing resources over the internet.",
    timeLimit: 25,
  },
]

export const DOMAINS = [...new Set(MCQ_BANK.map(q => q.domain))]