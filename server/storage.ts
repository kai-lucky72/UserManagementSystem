import { User, InsertUser, Client, InsertClient, AgentGroup, InsertAgentGroup, AgentGroupMember, 
  InsertAgentGroupMember, Attendance, InsertAttendance, AttendanceTimeFrame, InsertAttendanceTimeFrame,
  DailyReport, InsertDailyReport, HelpRequest, InsertHelpRequest, Message, InsertMessage } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByWorkIdAndEmail(workId: string, email: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByWorkId(workId: string): Promise<User | undefined>;
  getUserCount(): Promise<number>;
  getUsers(role?: string): Promise<User[]>;
  getUsersByManager(managerId: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  activateUser(id: number): Promise<User | undefined>;
  deactivateUser(id: number): Promise<User | undefined>;

  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getClientsByAgent(agentId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;

  // Agent Group operations
  getAgentGroup(id: number): Promise<AgentGroup | undefined>;
  getAgentGroupsBySalesStaff(salesStaffId: number): Promise<AgentGroup[]>;
  createAgentGroup(group: InsertAgentGroup): Promise<AgentGroup>;
  updateAgentGroup(id: number, group: Partial<InsertAgentGroup>): Promise<AgentGroup | undefined>;
  addAgentToGroup(member: InsertAgentGroupMember): Promise<AgentGroupMember>;
  removeAgentFromGroup(groupId: number, agentId: number): Promise<boolean>;
  getAgentsByGroup(groupId: number): Promise<User[]>;

  // Attendance operations
  getAttendance(id: number): Promise<Attendance | undefined>;
  getAttendanceByUserAndDate(userId: number, date: Date): Promise<Attendance | undefined>;
  getAttendanceByDate(date: Date): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;

  // Attendance Time Frame operations
  getAttendanceTimeFrame(id: number): Promise<AttendanceTimeFrame | undefined>;
  getAttendanceTimeFramesByManager(managerId: number): Promise<AttendanceTimeFrame[]>;
  createAttendanceTimeFrame(timeFrame: InsertAttendanceTimeFrame): Promise<AttendanceTimeFrame>;
  updateAttendanceTimeFrame(id: number, timeFrame: Partial<InsertAttendanceTimeFrame>): Promise<AttendanceTimeFrame | undefined>;

  // Daily Report operations
  getDailyReport(id: number): Promise<DailyReport | undefined>;
  getDailyReportsByAgentAndDate(agentId: number, date: Date): Promise<DailyReport | undefined>;
  getDailyReportsByDate(date: Date): Promise<DailyReport[]>;
  createDailyReport(report: InsertDailyReport): Promise<DailyReport>;

  // Help Request operations
  getHelpRequest(id: number): Promise<HelpRequest | undefined>;
  getHelpRequests(resolved?: boolean): Promise<HelpRequest[]>;
  createHelpRequest(request: InsertHelpRequest): Promise<HelpRequest>;
  resolveHelpRequest(id: number): Promise<HelpRequest | undefined>;

  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByUser(userId: number): Promise<Message[]>;
  getConversation(user1Id: number, user2Id: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private agentGroups: Map<number, AgentGroup>;
  private agentGroupMembers: Array<AgentGroupMember>;
  private attendance: Map<number, Attendance>;
  private attendanceTimeFrames: Map<number, AttendanceTimeFrame>;
  private dailyReports: Map<number, DailyReport>;
  private helpRequests: Map<number, HelpRequest>;
  private messages: Map<number, Message>;
  
  sessionStore: session.SessionStore;
  
  private currentUserId: number = 1;
  private currentClientId: number = 1;
  private currentAgentGroupId: number = 1;
  private currentAttendanceId: number = 1;
  private currentAttendanceTimeFrameId: number = 1;
  private currentDailyReportId: number = 1;
  private currentHelpRequestId: number = 1;
  private currentMessageId: number = 1;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.agentGroups = new Map();
    this.agentGroupMembers = [];
    this.attendance = new Map();
    this.attendanceTimeFrames = new Map();
    this.dailyReports = new Map();
    this.helpRequests = new Map();
    this.messages = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Clear expired sessions every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByWorkIdAndEmail(workId: string, email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.workId === workId && user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByWorkId(workId: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.workId === workId) {
        return user;
      }
    }
    return undefined;
  }

  async getUserCount(): Promise<number> {
    return this.users.size;
  }

  async getUsers(role?: string): Promise<User[]> {
    if (!role) {
      return Array.from(this.users.values());
    }
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  async getUsersByManager(managerId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.managerId === managerId);
  }

  async createUser(user: InsertUser): Promise<User> {
    const now = new Date();
    const id = this.currentUserId++;
    const newUser: User = {
      ...user,
      id,
      isActive: user.isActive !== undefined ? user.isActive : true,
      createdAt: now
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...userData,
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async activateUser(id: number): Promise<User | undefined> {
    return this.updateUser(id, { isActive: true });
  }

  async deactivateUser(id: number): Promise<User | undefined> {
    return this.updateUser(id, { isActive: false });
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientsByAgent(agentId: number): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(client => client.agentId === agentId);
  }

  async createClient(client: InsertClient): Promise<Client> {
    const now = new Date();
    const id = this.currentClientId++;
    const newClient: Client = {
      ...client,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.clients.set(id, newClient);
    return newClient;
  }

  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;

    const updatedClient: Client = {
      ...client,
      ...clientData,
      updatedAt: new Date()
    };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  // Agent Group operations
  async getAgentGroup(id: number): Promise<AgentGroup | undefined> {
    return this.agentGroups.get(id);
  }

  async getAgentGroupsBySalesStaff(salesStaffId: number): Promise<AgentGroup[]> {
    return Array.from(this.agentGroups.values()).filter(group => group.salesStaffId === salesStaffId);
  }

  async createAgentGroup(group: InsertAgentGroup): Promise<AgentGroup> {
    const id = this.currentAgentGroupId++;
    const newGroup: AgentGroup = {
      ...group,
      id,
      isActive: group.isActive !== undefined ? group.isActive : true
    };
    this.agentGroups.set(id, newGroup);
    return newGroup;
  }

  async updateAgentGroup(id: number, groupData: Partial<InsertAgentGroup>): Promise<AgentGroup | undefined> {
    const group = this.agentGroups.get(id);
    if (!group) return undefined;

    const updatedGroup: AgentGroup = {
      ...group,
      ...groupData
    };
    this.agentGroups.set(id, updatedGroup);
    return updatedGroup;
  }

  async addAgentToGroup(member: InsertAgentGroupMember): Promise<AgentGroupMember> {
    this.agentGroupMembers.push(member);
    return member;
  }

  async removeAgentFromGroup(groupId: number, agentId: number): Promise<boolean> {
    const initialLength = this.agentGroupMembers.length;
    this.agentGroupMembers = this.agentGroupMembers.filter(
      member => !(member.groupId === groupId && member.agentId === agentId)
    );
    return initialLength > this.agentGroupMembers.length;
  }

  async getAgentsByGroup(groupId: number): Promise<User[]> {
    const agentIds = this.agentGroupMembers
      .filter(member => member.groupId === groupId)
      .map(member => member.agentId);
    
    return Array.from(this.users.values())
      .filter(user => agentIds.includes(user.id));
  }

  // Attendance operations
  async getAttendance(id: number): Promise<Attendance | undefined> {
    return this.attendance.get(id);
  }

  async getAttendanceByUserAndDate(userId: number, date: Date): Promise<Attendance | undefined> {
    const dateStr = date.toISOString().split('T')[0];
    
    for (const attendance of this.attendance.values()) {
      const attDateStr = attendance.date.toISOString().split('T')[0];
      if (attendance.userId === userId && attDateStr === dateStr) {
        return attendance;
      }
    }
    return undefined;
  }

  async getAttendanceByDate(date: Date): Promise<Attendance[]> {
    const dateStr = date.toISOString().split('T')[0];
    
    return Array.from(this.attendance.values()).filter(attendance => {
      const attDateStr = attendance.date.toISOString().split('T')[0];
      return attDateStr === dateStr;
    });
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const id = this.currentAttendanceId++;
    const now = new Date();
    const newAttendance: Attendance = {
      ...attendanceData,
      id,
      checkInTime: now
    };
    this.attendance.set(id, newAttendance);
    return newAttendance;
  }

  // Attendance Time Frame operations
  async getAttendanceTimeFrame(id: number): Promise<AttendanceTimeFrame | undefined> {
    return this.attendanceTimeFrames.get(id);
  }

  async getAttendanceTimeFramesByManager(managerId: number): Promise<AttendanceTimeFrame[]> {
    return Array.from(this.attendanceTimeFrames.values())
      .filter(frame => frame.managerId === managerId);
  }

  async createAttendanceTimeFrame(timeFrameData: InsertAttendanceTimeFrame): Promise<AttendanceTimeFrame> {
    const id = this.currentAttendanceTimeFrameId++;
    const now = new Date();
    const newTimeFrame: AttendanceTimeFrame = {
      ...timeFrameData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.attendanceTimeFrames.set(id, newTimeFrame);
    return newTimeFrame;
  }

  async updateAttendanceTimeFrame(id: number, timeFrameData: Partial<InsertAttendanceTimeFrame>): Promise<AttendanceTimeFrame | undefined> {
    const timeFrame = this.attendanceTimeFrames.get(id);
    if (!timeFrame) return undefined;

    const updatedTimeFrame: AttendanceTimeFrame = {
      ...timeFrame,
      ...timeFrameData,
      updatedAt: new Date()
    };
    this.attendanceTimeFrames.set(id, updatedTimeFrame);
    return updatedTimeFrame;
  }

  // Daily Report operations
  async getDailyReport(id: number): Promise<DailyReport | undefined> {
    return this.dailyReports.get(id);
  }

  async getDailyReportsByAgentAndDate(agentId: number, date: Date): Promise<DailyReport | undefined> {
    const dateStr = date.toISOString().split('T')[0];
    
    for (const report of this.dailyReports.values()) {
      const reportDateStr = report.date.toISOString().split('T')[0];
      if (report.agentId === agentId && reportDateStr === dateStr) {
        return report;
      }
    }
    return undefined;
  }

  async getDailyReportsByDate(date: Date): Promise<DailyReport[]> {
    const dateStr = date.toISOString().split('T')[0];
    
    return Array.from(this.dailyReports.values()).filter(report => {
      const reportDateStr = report.date.toISOString().split('T')[0];
      return reportDateStr === dateStr;
    });
  }

  async createDailyReport(reportData: InsertDailyReport): Promise<DailyReport> {
    const id = this.currentDailyReportId++;
    const now = new Date();
    const newReport: DailyReport = {
      ...reportData,
      id,
      createdAt: now
    };
    this.dailyReports.set(id, newReport);
    return newReport;
  }

  // Help Request operations
  async getHelpRequest(id: number): Promise<HelpRequest | undefined> {
    return this.helpRequests.get(id);
  }

  async getHelpRequests(resolved?: boolean): Promise<HelpRequest[]> {
    if (resolved === undefined) {
      return Array.from(this.helpRequests.values());
    }
    return Array.from(this.helpRequests.values())
      .filter(request => request.resolved === resolved);
  }

  async createHelpRequest(requestData: InsertHelpRequest): Promise<HelpRequest> {
    const id = this.currentHelpRequestId++;
    const now = new Date();
    const newRequest: HelpRequest = {
      ...requestData,
      id,
      resolved: false,
      createdAt: now
    };
    this.helpRequests.set(id, newRequest);
    return newRequest;
  }

  async resolveHelpRequest(id: number): Promise<HelpRequest | undefined> {
    const request = this.helpRequests.get(id);
    if (!request) return undefined;

    const resolvedRequest: HelpRequest = {
      ...request,
      resolved: true
    };
    this.helpRequests.set(id, resolvedRequest);
    return resolvedRequest;
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByUser(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.senderId === userId || message.receiverId === userId);
  }

  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        (message.senderId === user1Id && message.receiverId === user2Id) ||
        (message.senderId === user2Id && message.receiverId === user1Id)
      )
      .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const now = new Date();
    const newMessage: Message = {
      ...messageData,
      id,
      read: false,
      sentAt: now
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;

    const readMessage: Message = {
      ...message,
      read: true
    };
    this.messages.set(id, readMessage);
    return readMessage;
  }
}

export const storage = new MemStorage();
