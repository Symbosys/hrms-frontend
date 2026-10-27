export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  departmentId?: string | null;
  email: string;
  phone: string;
  avatar: string;
  status: 'Active' | 'On Leave' | 'Terminated' | 'Resigned' | 'Probation';
  joiningDate: string;
  location: string;
  manager: string;
  userId?: string | null;
  designation?: string;
  permissions?: string[];
  
  // Salary Details
  basic: number;
  hra: number;
  allowance: number;
  deductions: number;
  netSalary: number;
  bankName: string;
  bankAccount: string;
  ifsc: string;
  pan: string;
  aadhaar: string;
  uan: string;
  pfNumber: string;

  // Personal Details
  gender: string;
  dob: string;
  bloodGroup: string;
  maritalStatus: string;
  qualification: string;
  university: string;
  passingYear: string;
  fatherName?: string;
  permanentAddress?: string;
  languagesSpoken?: string;
  
  // Work History
  pastCompanies: { company: string; role: string; duration: string; ctc: string }[];
  promotions: { date: string; oldRole: string; newRole: string; salaryIncrement: string }[];
  transfers: { date: string; oldDept: string; newDept: string; location: string }[];
  
  // Workflows
  probationDuration: string; // e.g. "6 Months"
  probationEnd: string;
  confirmationStatus: 'Pending' | 'Confirmed' | 'Extended';
  exitDate?: string;
  clearanceStatus?: 'Pending' | 'Approved';

  // Assets & Family
  assets: string[];
  familyMembers?: {
    id: string;
    name: string;
    relation: string;
    dob: string;
    contact?: string;
    bloodGroup?: string;
    isNominee: boolean;
    isInsuranceCovered: boolean;
  }[];
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  appliedOn: string;
}

export interface ClaimRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Travel' | 'Mileage' | 'Food' | 'Accommodation' | 'Other';
  amount: number;
  date: string;
  reason: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  receiptUrl?: string;
}

export interface JobRequisition {
  id: string;
  title: string;
  department: string;
  openings: number;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Closed' | 'Draft';
  candidatesCount: number;
  postedDate: string;
}

export interface Candidate {
  id: string;
  name: string;
  jobTitle: string;
  email: string;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Onboarding';
  experience: string;
  rating: number;
  resumeUrl: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'Laptop' | 'Desktop' | 'Monitor' | 'Phone' | 'SIM' | 'ID Card' | 'Vehicle';
  serialNumber: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedDate?: string;
  status: 'In Use' | 'Available' | 'Under Repair';
}

export interface HelpTicket {
  id: string;
  employeeName: string;
  category: 'IT Support' | 'HR Query' | 'Facilities' | 'Payroll';
  subject: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdDate: string;
  description: string;
}

export interface FeedPost {
  id: string;
  author: string;
  authorRole: string;
  authorAvatar: string;
  content: string;
  likes: number;
  comments: { id: string; user: string; text: string; date: string }[];
  reactions: { type: string; count: number }[];
  likedByMe?: boolean;
  date: string;
  image?: string;
}

export const initialEmployees: Employee[] = [
  {
    id: "EMP001",
    name: "Aarav Sharma",
    role: "Senior Software Engineer",
    department: "Engineering",
    email: "aarav.sharma@factohr-demo.com",
    phone: "+91 98765 43210",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
    status: "Active",
    joiningDate: "2022-03-15",
    location: "Mumbai",
    manager: "Neha Patel",
    basic: 50000,
    hra: 20000,
    allowance: 15000,
    deductions: 8000,
    netSalary: 77000,
    bankName: "HDFC Bank",
    bankAccount: "50100439281023",
    ifsc: "HDFC0000240",
    pan: "ABCDE1234F",
    aadhaar: "1234-5678-9012",
    uan: "100438291038",
    pfNumber: "MH/BAN/0043928/000/0001023",
    gender: "Male",
    dob: "1994-08-22",
    bloodGroup: "O+",
    maritalStatus: "Married",
    qualification: "B.Tech in Computer Science",
    university: "IIT Bombay",
    passingYear: "2016",
    pastCompanies: [
      { company: "TCS", role: "Software Engineer", duration: "3 Years", ctc: "6,00,000" },
      { company: "Cognizant", role: "Senior Developer", duration: "2 Years", ctc: "10,50,000" }
    ],
    promotions: [
      { date: "2024-04-01", oldRole: "Software Engineer", newRole: "Senior Software Engineer", salaryIncrement: "15%" }
    ],
    transfers: [
      { date: "2023-09-01", oldDept: "Engineering - QA", newDept: "Engineering - Core UI", location: "Mumbai" }
    ],
    probationDuration: "6 Months",
    probationEnd: "2022-09-15",
    confirmationStatus: "Confirmed",
    assets: ["AST-041 (Laptop)", "AST-102 (ID Card)"]
  },
  {
    id: "EMP002",
    name: "Neha Patel",
    role: "Engineering Manager",
    department: "Engineering",
    email: "neha.patel@factohr-demo.com",
    phone: "+91 98234 56789",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
    status: "Active",
    joiningDate: "2020-01-10",
    location: "Pune",
    manager: "Vikram Malhotra",
    basic: 85000,
    hra: 34000,
    allowance: 25000,
    deductions: 12000,
    netSalary: 132000,
    bankName: "ICICI Bank",
    bankAccount: "000401539281",
    ifsc: "ICIC0000004",
    pan: "QWERT5678Y",
    aadhaar: "9876-5432-1098",
    uan: "100982739182",
    pfNumber: "MH/PUN/0023491/000/0002931",
    gender: "Female",
    dob: "1988-11-04",
    bloodGroup: "A+",
    maritalStatus: "Married",
    qualification: "M.Tech in Software Engineering",
    university: "COEP Pune",
    passingYear: "2010",
    pastCompanies: [
      { company: "Infosys", role: "Team Lead", duration: "5 Years", ctc: "12,00,000" },
      { company: "Wipro", role: "Architect", duration: "4 Years", ctc: "18,00,000" }
    ],
    promotions: [
      { date: "2023-01-01", oldRole: "Tech Lead", newRole: "Engineering Manager", salaryIncrement: "20%" }
    ],
    transfers: [],
    probationDuration: "6 Months",
    probationEnd: "2020-07-10",
    confirmationStatus: "Confirmed",
    assets: ["AST-002 (Laptop)", "AST-095 (Phone)", "AST-101 (ID Card)"]
  },
  {
    id: "EMP003",
    name: "Rohan Das",
    role: "Product Designer",
    department: "Design",
    email: "rohan.das@factohr-demo.com",
    phone: "+91 97123 45678",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
    status: "On Leave",
    joiningDate: "2023-06-01",
    location: "Bengaluru",
    manager: "Priya Nair",
    basic: 45000,
    hra: 18000,
    allowance: 12000,
    deductions: 7000,
    netSalary: 68000,
    bankName: "Axis Bank",
    bankAccount: "91201004382918",
    ifsc: "UTIB0000023",
    pan: "PLMKO0987D",
    aadhaar: "2345-6789-0123",
    uan: "100234918239",
    pfNumber: "KA/BLR/0098432/000/0003482",
    gender: "Male",
    dob: "1996-03-12",
    bloodGroup: "B+",
    maritalStatus: "Single",
    qualification: "Bachelor of Design",
    university: "NID Ahmedabad",
    passingYear: "2018",
    pastCompanies: [
      { company: "Directi", role: "UI Designer", duration: "2 Years", ctc: "7,00,000" },
      { company: "Ola", role: "Visual Designer", duration: "2 Years", ctc: "11,00,000" }
    ],
    promotions: [],
    transfers: [],
    probationDuration: "3 Months",
    probationEnd: "2023-09-01",
    confirmationStatus: "Confirmed",
    assets: ["AST-052 (Laptop)", "AST-103 (ID Card)", "AST-203 (Monitor)"]
  },
  {
    id: "EMP004",
    name: "Priya Nair",
    role: "VP of Product",
    department: "Product",
    email: "priya.nair@factohr-demo.com",
    phone: "+91 99887 76655",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
    status: "Active",
    joiningDate: "2019-05-20",
    location: "Bengaluru",
    manager: "Vikram Malhotra",
    basic: 120000,
    hra: 48000,
    allowance: 40000,
    deductions: 20000,
    netSalary: 188000,
    bankName: "SBI",
    bankAccount: "30438291038",
    ifsc: "SBIN0004562",
    pan: "ZXCVB4321A",
    aadhaar: "3456-7890-1234",
    uan: "100349281038",
    pfNumber: "KA/BLR/0023412/000/0000938",
    gender: "Female",
    dob: "1985-06-30",
    bloodGroup: "AB+",
    maritalStatus: "Married",
    qualification: "MBA in Product Management",
    university: "IIM Bangalore",
    passingYear: "2008",
    pastCompanies: [
      { company: "Flipkart", role: "Director of Product", duration: "6 Years", ctc: "35,00,000" },
      { company: "Amazon", role: "Sr. Product Manager", duration: "4 Years", ctc: "26,00,000" }
    ],
    promotions: [
      { date: "2022-07-01", oldRole: "Head of Product", newRole: "VP of Product", salaryIncrement: "25%" }
    ],
    transfers: [],
    probationDuration: "6 Months",
    probationEnd: "2019-11-20",
    confirmationStatus: "Confirmed",
    assets: ["AST-005 (Laptop)", "AST-099 (Phone)", "AST-104 (ID Card)"]
  },
  {
    id: "EMP005",
    name: "Vikram Malhotra",
    role: "Chief Executive Officer",
    department: "Executive",
    email: "vikram@factohr-demo.com",
    phone: "+91 90000 11111",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120",
    status: "Active",
    joiningDate: "2015-01-01",
    location: "Mumbai",
    manager: "Board of Directors",
    basic: 250000,
    hra: 100000,
    allowance: 80000,
    deductions: 40000,
    netSalary: 390000,
    bankName: "HDFC Bank",
    bankAccount: "5010000012345",
    ifsc: "HDFC0000240",
    pan: "CEOIN8888Z",
    aadhaar: "1111-2222-3333",
    uan: "100000000001",
    pfNumber: "MH/BAN/0000001/000/0000001",
    gender: "Male",
    dob: "1975-04-18",
    bloodGroup: "O+",
    maritalStatus: "Married",
    qualification: "M.S. & MBA",
    university: "Stanford University",
    passingYear: "1998",
    pastCompanies: [
      { company: "McKinsey", role: "Partner", duration: "10 Years", ctc: "1,20,00,000" }
    ],
    promotions: [],
    transfers: [],
    probationDuration: "None",
    probationEnd: "2015-01-01",
    confirmationStatus: "Confirmed",
    assets: ["AST-001 (Laptop)", "AST-080 (Phone)", "AST-100 (ID Card)"]
  },
  {
    id: "EMP006",
    name: "Karan Johar",
    role: "HR Generalist",
    department: "Human Resources",
    email: "karan.johar@factohr-demo.com",
    phone: "+91 98112 23344",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=120",
    status: "Active",
    joiningDate: "2023-10-15",
    location: "Delhi",
    manager: "Shalini Sen",
    basic: 30000,
    hra: 12000,
    allowance: 8000,
    deductions: 4000,
    netSalary: 46000,
    bankName: "Kotak Mahindra Bank",
    bankAccount: "451290382710",
    ifsc: "KKBK0000192",
    pan: "ASDGH1562M",
    aadhaar: "4567-8901-2345",
    uan: "100481920381",
    pfNumber: "DL/CPM/0038291/000/0001928",
    gender: "Male",
    dob: "1997-09-09",
    bloodGroup: "A-",
    maritalStatus: "Single",
    qualification: "MBA in HR",
    university: "Delhi School of Economics",
    passingYear: "2021",
    pastCompanies: [
      { company: "Genpact", role: "HR Executive", duration: "2 Years", ctc: "4,20,000" }
    ],
    promotions: [],
    transfers: [],
    probationDuration: "6 Months",
    probationEnd: "2024-04-15",
    confirmationStatus: "Confirmed",
    assets: ["AST-064 (Laptop)", "AST-105 (ID Card)"]
  },
  {
    id: "EMP007",
    name: "Shalini Sen",
    role: "HR Director",
    department: "Human Resources",
    email: "shalini.sen@factohr-demo.com",
    phone: "+91 98456 12345",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120",
    status: "Active",
    joiningDate: "2018-09-01",
    location: "Delhi",
    manager: "Vikram Malhotra",
    basic: 90000,
    hra: 36000,
    allowance: 24000,
    deductions: 13000,
    netSalary: 137000,
    bankName: "HDFC Bank",
    bankAccount: "5010023491038",
    ifsc: "HDFC0000240",
    pan: "MKIUY9081T",
    aadhaar: "5678-9012-3456",
    uan: "100983271038",
    pfNumber: "DL/CPM/0023910/000/0000120",
    gender: "Female",
    dob: "1983-02-14",
    bloodGroup: "B-",
    maritalStatus: "Married",
    qualification: "Post Graduate in HR",
    university: "XLRI Jamshedpur",
    passingYear: "2006",
    pastCompanies: [
      { company: "ICICI Bank", role: "HR Manager", duration: "7 Years", ctc: "16,00,000" },
      { company: "Reliance", role: "Senior HR Manager", duration: "4 Years", ctc: "22,00,000" }
    ],
    promotions: [
      { date: "2021-04-01", oldRole: "HR Manager", newRole: "HR Director", salaryIncrement: "22%" }
    ],
    transfers: [],
    probationDuration: "6 Months",
    probationEnd: "2019-03-01",
    confirmationStatus: "Confirmed",
    assets: ["AST-006 (Laptop)", "AST-092 (Phone)", "AST-106 (ID Card)"]
  },
  {
    id: "EMP008",
    name: "Ananya Roy",
    role: "Intern Frontend Developer",
    department: "Engineering",
    email: "ananya.roy@factohr-demo.com",
    phone: "+91 96543 21098",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120",
    status: "Probation",
    joiningDate: "2026-05-01",
    location: "Pune",
    manager: "Neha Patel",
    basic: 15000,
    hra: 6000,
    allowance: 4000,
    deductions: 1000,
    netSalary: 24000,
    bankName: "Yes Bank",
    bankAccount: "00129038472910",
    ifsc: "YESB0000012",
    pan: "PLMKS3829C",
    aadhaar: "6789-0123-4567",
    uan: "100984391038",
    pfNumber: "MH/PUN/0023491/000/0008432",
    gender: "Female",
    dob: "2003-05-15",
    bloodGroup: "O-",
    maritalStatus: "Single",
    qualification: "B.E. in Information Technology",
    university: "MIT Pune",
    passingYear: "2026",
    pastCompanies: [],
    promotions: [],
    transfers: [],
    probationDuration: "6 Months",
    probationEnd: "2026-11-01",
    confirmationStatus: "Pending",
    assets: ["AST-078 (Laptop)", "AST-107 (ID Card)"]
  },
  {
    id: "EMP009",
    name: "Aditya Verma",
    role: "Financial Analyst",
    department: "Finance",
    email: "aditya.verma@factohr-demo.com",
    phone: "+91 95678 12345",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120",
    status: "Active",
    joiningDate: "2024-02-10",
    location: "Mumbai",
    manager: "Rajesh Iyer",
    basic: 40000,
    hra: 16000,
    allowance: 10000,
    deductions: 5000,
    netSalary: 61000,
    bankName: "IndusInd Bank",
    bankAccount: "10029304859103",
    ifsc: "INDB0000015",
    pan: "OIKJH8736B",
    aadhaar: "7890-1234-5678",
    uan: "100382910381",
    pfNumber: "MH/BAN/0043928/000/0002931",
    gender: "Male",
    dob: "1995-12-25",
    bloodGroup: "B+",
    maritalStatus: "Married",
    qualification: "Chartered Accountant (CA)",
    university: "ICAI",
    passingYear: "2019",
    pastCompanies: [
      { company: "PwC", role: "Associate Accountant", duration: "3 Years", ctc: "8,00,000" }
    ],
    promotions: [],
    transfers: [],
    probationDuration: "6 Months",
    probationEnd: "2024-08-10",
    confirmationStatus: "Confirmed",
    exitDate: "2026-07-31",
    clearanceStatus: "Pending",
    assets: ["AST-039 (Laptop)", "AST-108 (ID Card)"]
  },
  {
    id: "EMP010",
    name: "Sanjay Singhania",
    role: "IT Infrastructure Lead",
    department: "IT",
    email: "sanjay.singhania@symbosys-demo.com",
    phone: "+91 98765 88990",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120",
    status: "Active",
    joiningDate: "2021-08-15",
    location: "Mumbai",
    manager: "Vikram Malhotra",
    basic: 65000,
    hra: 26000,
    allowance: 18000,
    deductions: 9000,
    netSalary: 100000,
    bankName: "HDFC Bank",
    bankAccount: "50100987654321",
    ifsc: "HDFC0000240",
    pan: "SANSI1234K",
    aadhaar: "8901-2345-6789",
    uan: "100987654321",
    pfNumber: "MH/BAN/0043928/000/0008899",
    gender: "Male",
    dob: "1991-05-10",
    bloodGroup: "O+",
    maritalStatus: "Married",
    qualification: "B.Tech in IT",
    university: "VJTI Mumbai",
    passingYear: "2013",
    pastCompanies: [],
    promotions: [],
    transfers: [],
    probationDuration: "6 Months",
    probationEnd: "2022-02-15",
    confirmationStatus: "Confirmed",
    assets: ["AST-088 (Server Rack)", "AST-109 (ID Card)"]
  },
  {
    id: "EMP011",
    name: "Vikramaditya Roy",
    role: "IT Systems Engineer",
    department: "IT",
    email: "vikram.roy@symbosys-demo.com",
    phone: "+91 97654 33221",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120",
    status: "Active",
    joiningDate: "2023-01-10",
    location: "Mumbai",
    manager: "Sanjay Singhania",
    basic: 42000,
    hra: 16800,
    allowance: 11000,
    deductions: 5000,
    netSalary: 64800,
    bankName: "ICICI Bank",
    bankAccount: "000409876123",
    ifsc: "ICIC0000004",
    pan: "VIKRO5544P",
    aadhaar: "9012-3456-7890",
    uan: "100987654322",
    pfNumber: "MH/BAN/0043928/000/0003322",
    gender: "Male",
    dob: "1996-09-20",
    bloodGroup: "A+",
    maritalStatus: "Single",
    qualification: "B.Sc in Computer Science",
    university: "Mumbai University",
    passingYear: "2018",
    pastCompanies: [],
    promotions: [],
    transfers: [],
    probationDuration: "6 Months",
    probationEnd: "2023-07-10",
    confirmationStatus: "Confirmed",
    assets: ["AST-090 (Laptop)", "AST-110 (ID Card)"]
  },
  {
    id: "EMP012",
    name: "Meera Kapoor",
    role: "Sales Director & Head of Growth",
    department: "Sales",
    email: "meera.kapoor@symbosys-demo.com",
    phone: "+91 98111 22233",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120",
    status: "Active",
    joiningDate: "2020-03-01",
    location: "Mumbai",
    manager: "Vikram Malhotra",
    basic: 95000,
    hra: 38000,
    allowance: 27000,
    deductions: 14000,
    netSalary: 146000,
    bankName: "Axis Bank",
    bankAccount: "91201009876543",
    ifsc: "UTIB0000023",
    pan: "MEEKAP9988L",
    aadhaar: "1234-9876-5432",
    uan: "100987654323",
    pfNumber: "MH/BAN/0043928/000/0002223",
    gender: "Female",
    dob: "1989-10-12",
    bloodGroup: "B+",
    maritalStatus: "Married",
    qualification: "MBA in Marketing & Sales",
    university: "NMIMS Mumbai",
    passingYear: "2012",
    pastCompanies: [],
    promotions: [],
    transfers: [],
    probationDuration: "6 Months",
    probationEnd: "2020-09-01",
    confirmationStatus: "Confirmed",
    assets: ["AST-091 (MacBook Pro)", "AST-111 (ID Card)"]
  },
  {
    id: "EMP013",
    name: "Karan Johar Sales",
    role: "Senior Sales Executive",
    department: "Sales",
    email: "karan.sales@symbosys-demo.com",
    phone: "+91 98222 33344",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
    status: "Active",
    joiningDate: "2022-11-15",
    location: "Delhi",
    manager: "Meera Kapoor",
    basic: 48000,
    hra: 19200,
    allowance: 12000,
    deductions: 6000,
    netSalary: 73200,
    bankName: "HDFC Bank",
    bankAccount: "50100876543210",
    ifsc: "HDFC0000240",
    pan: "KARSAL4433M",
    aadhaar: "2345-0987-6543",
    uan: "100987654324",
    pfNumber: "DL/CPM/0038291/000/0003334",
    gender: "Male",
    dob: "1994-07-07",
    bloodGroup: "AB+",
    maritalStatus: "Single",
    qualification: "BBA in Business Management",
    university: "DU",
    passingYear: "2016",
    pastCompanies: [],
    promotions: [],
    transfers: [],
    probationDuration: "6 Months",
    probationEnd: "2023-05-15",
    confirmationStatus: "Confirmed",
    assets: ["AST-092 (Laptop)", "AST-112 (ID Card)"]
  }
];

export const initialLeaveRequests: LeaveRequest[] = [
  {
    id: "LRQ001",
    employeeId: "EMP003",
    employeeName: "Rohan Das",
    type: "Sick Leave",
    startDate: "2026-07-01",
    endDate: "2026-07-03",
    days: 3,
    reason: "Fever and doctor advised rest",
    status: "Pending",
    appliedOn: "2026-06-30"
  },
  {
    id: "LRQ002",
    employeeId: "EMP001",
    employeeName: "Aarav Sharma",
    type: "Casual Leave",
    startDate: "2026-07-08",
    endDate: "2026-07-10",
    days: 3,
    reason: "Family function in hometown",
    status: "Pending",
    appliedOn: "2026-06-29"
  },
  {
    id: "LRQ003",
    employeeId: "EMP008",
    employeeName: "Ananya Roy",
    type: "Earned Leave",
    startDate: "2026-06-15",
    endDate: "2026-06-18",
    days: 4,
    reason: "College graduation ceremony & documentation",
    status: "Approved",
    appliedOn: "2026-06-05"
  }
];

export const initialClaims: ClaimRequest[] = [
  {
    id: "CLM001",
    employeeId: "EMP001",
    employeeName: "Aarav Sharma",
    type: "Travel",
    amount: 3200,
    date: "2026-06-24",
    reason: "Client meeting in Pune - Cab & Toll charges",
    status: "Pending"
  },
  {
    id: "CLM002",
    employeeId: "EMP006",
    employeeName: "Karan Johar",
    type: "Food",
    amount: 1200,
    date: "2026-06-28",
    reason: "Team engagement lunch hosting",
    status: "Pending"
  },
  {
    id: "CLM003",
    employeeId: "EMP002",
    employeeName: "Neha Patel",
    type: "Accommodation",
    amount: 8500,
    date: "2026-06-10",
    reason: "Tech Conference hotel stay",
    status: "Approved"
  }
];

export const initialJobs: JobRequisition[] = [
  {
    id: "JOB001",
    title: "Senior React Developer",
    department: "Engineering",
    openings: 3,
    priority: "High",
    status: "Open",
    candidatesCount: 18,
    postedDate: "2026-06-15"
  },
  {
    id: "JOB002",
    title: "HR Analyst",
    department: "Human Resources",
    openings: 1,
    priority: "Medium",
    status: "Open",
    candidatesCount: 7,
    postedDate: "2026-06-20"
  },
  {
    id: "JOB003",
    title: "Financial Controller",
    department: "Finance",
    openings: 1,
    priority: "Low",
    status: "Draft",
    candidatesCount: 0,
    postedDate: "2026-06-28"
  }
];

export const initialCandidates: Candidate[] = [
  {
    id: "CND001",
    name: "Rahul Mehta",
    jobTitle: "Senior React Developer",
    email: "rahul.m@gmail.com",
    stage: "Interview",
    experience: "5.5 Years",
    rating: 4.5,
    resumeUrl: "cv_rahul_mehta.pdf"
  },
  {
    id: "CND002",
    name: "Shreya Ghoshal",
    jobTitle: "Senior React Developer",
    email: "shreya.g@yahoo.com",
    stage: "Screening",
    experience: "3 Years",
    rating: 4.0,
    resumeUrl: "cv_shreya_g.pdf"
  },
  {
    id: "CND003",
    name: "Sunil Shetty",
    jobTitle: "HR Analyst",
    email: "sunil.shetty@outlook.com",
    stage: "Offer",
    experience: "2 Years",
    rating: 4.8,
    resumeUrl: "cv_sunil_s.pdf"
  }
];

export const initialAssets: Asset[] = [
  { id: "AST-001", name: "Apple MacBook Pro M3 Max", type: "Laptop", serialNumber: "C02F2391MD23", assignedTo: "EMP005", assignedToName: "Vikram Malhotra", assignedDate: "2015-01-01", status: "In Use" },
  { id: "AST-002", name: "Lenovo ThinkPad X1 Carbon", type: "Laptop", serialNumber: "L3N983271A", assignedTo: "EMP002", assignedToName: "Neha Patel", assignedDate: "2020-01-10", status: "In Use" },
  { id: "AST-041", name: "Dell Latitude 5420", type: "Laptop", serialNumber: "CN-0F839K-1293", assignedTo: "EMP001", assignedToName: "Aarav Sharma", assignedDate: "2022-03-15", status: "In Use" },
  { id: "AST-052", name: "Apple MacBook Pro M1", type: "Laptop", serialNumber: "C02D1238FD31", assignedTo: "EMP003", assignedToName: "Rohan Das", assignedDate: "2023-06-01", status: "In Use" },
  { id: "AST-064", name: "Dell Latitude 5420", type: "Laptop", serialNumber: "CN-0F839K-8432", assignedTo: "EMP006", assignedToName: "Karan Johar", assignedDate: "2023-10-15", status: "In Use" },
  { id: "AST-078", name: "Lenovo ThinkPad L14", type: "Laptop", serialNumber: "L3N84931D", assignedTo: "EMP008", assignedToName: "Ananya Roy", assignedDate: "2026-05-01", status: "In Use" },
  { id: "AST-100", name: "Executive RFID Card", type: "ID Card", serialNumber: "ID-00100", assignedTo: "EMP005", assignedToName: "Vikram Malhotra", assignedDate: "2015-01-01", status: "In Use" },
  { id: "AST-200", name: "Dell 27 Monitor P2722H", type: "Monitor", serialNumber: "MX-0294-A10", status: "Available" },
  { id: "AST-201", name: "Apple iPhone 15 Pro", type: "Phone", serialNumber: "A284910384B", status: "Under Repair" }
];

export const initialTickets: HelpTicket[] = [
  {
    id: "TKT001",
    employeeName: "Aarav Sharma",
    category: "IT Support",
    subject: "VPN connection dropping repeatedly",
    priority: "High",
    status: "In Progress",
    createdDate: "2026-06-29",
    description: "Whenever I connect to the Mumbai office VPN, it disconnects after 5 minutes with a timeout error."
  },
  {
    id: "TKT002",
    employeeName: "Rohan Das",
    category: "HR Query",
    subject: "Clarification on Maternity/Paternity Leave policy extension",
    priority: "Medium",
    status: "Open",
    createdDate: "2026-06-30",
    description: "Heard there was a recent policy change extending the Paternity leave benefit. Could you send the new policy document?"
  },
  {
    id: "TKT003",
    employeeName: "Ananya Roy",
    category: "Facilities",
    subject: "Request for drawer key for desk D-12",
    priority: "Low",
    status: "Resolved",
    createdDate: "2026-06-26",
    description: "I haven't received the physical keys for my workspace drawers. Requesting facilities team to dispatch."
  }
];

export const initialFeedPosts: FeedPost[] = [
  {
    id: "PST001",
    author: "Vikram Malhotra",
    authorRole: "Chief Executive Officer",
    authorAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120",
    content: "Extremely proud to announce that factoHR has achieved record customer satisfaction scores this quarter! Thank you to the entire engineering, design, product, and HR teams for their incredible commitment and hard work. Let's keep pushing the boundaries! 🚀🏆",
    likes: 24,
    comments: [
      { id: "C1", user: "Shalini Sen", text: "Incredible news! Congratulations to everyone!", date: "2026-06-30" },
      { id: "C2", user: "Priya Nair", text: "Kudos to the engineering team for delivering top-class stability!", date: "2026-06-30" }
    ],
    reactions: [
      { type: "👍", count: 18 },
      { type: "❤️", count: 12 },
      { type: "👏", count: 15 }
    ],
    date: "2026-06-30",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "PST002",
    author: "Shalini Sen",
    authorRole: "HR Director",
    authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120",
    content: "Please join me in welcoming our new summer interns joining us this month across Pune and Delhi offices! Feel free to reach out, share resources, and guide them in their onboarding journey. Welcome to the family! 🎉🎓",
    likes: 12,
    comments: [
      { id: "C3", user: "Karan Johar", text: "Welcome onboard all! Looking forward to working together.", date: "2026-07-01" }
    ],
    reactions: [
      { type: "👍", count: 10 },
      { type: "👏", count: 8 }
    ],
    date: "2026-07-01"
  }
];

export const upcomingHolidays = [
  { name: "Independence Day", date: "2026-08-15", day: "Saturday", type: "National Holiday" },
  { name: "Ganesh Chaturthi", date: "2026-09-14", day: "Monday", type: "Regional Holiday" },
  { name: "Gandhi Jayanti", date: "2026-10-02", day: "Friday", type: "National Holiday" },
  { name: "Diwali (Deepavali)", date: "2026-11-08", day: "Sunday", type: "Gazetted Holiday" },
  { name: "Christmas Day", date: "2026-12-25", day: "Friday", type: "National Holiday" }
];
