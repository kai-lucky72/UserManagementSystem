import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { User, InsertUser, InsertAttendance, InsertClient, InsertAgentGroup, InsertAgentGroupMember, InsertMessage, InsertDailyReport } from "@shared/schema";

// Middleware to check if user is authenticated
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user has required role
const hasRole = (roles: string[]) => (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const userRole = req.user.role;
  if (!roles.includes(userRole)) {
    return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  await setupAuth(app);

  // Admin routes
  app.get("/api/admin/users", isAuthenticated, hasRole(["Admin"]), async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/admin/managers", isAuthenticated, hasRole(["Admin"]), async (req, res) => {
    try {
      const managers = await storage.getUsers("Manager");
      res.json(managers);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Activity log endpoints
  app.get("/api/admin/activities", isAuthenticated, hasRole(["Admin"]), async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getActivities(page, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.post("/api/admin/activities", isAuthenticated, hasRole(["Admin"]), async (req, res) => {
    try {
      const admin = req.user as User;
      const activityData = {
        userId: admin.id,
        action: req.body.action,
        details: req.body.details,
        timestamp: new Date()
      };
      const activity = await storage.logActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // User activation/deactivation
  app.post("/api/admin/users/:id/activate", isAuthenticated, hasRole(["Admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.activateUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log activity
      const admin = req.user as User;
      await storage.logActivity({
        userId: admin.id,
        action: "activate_user",
        details: `Activated user: ${user.firstName} ${user.lastName} (${user.role})`,
        timestamp: new Date()
      });
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.post("/api/admin/users/:id/deactivate", isAuthenticated, hasRole(["Admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.deactivateUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log activity
      const admin = req.user as User;
      await storage.logActivity({
        userId: admin.id,
        action: "deactivate_user",
        details: `Deactivated user: ${user.firstName} ${user.lastName} (${user.role})`,
        timestamp: new Date()
      });
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/admin/managers", isAuthenticated, hasRole(["Admin"]), async (req, res) => {
    try {
      const admin = req.user as User;
      const managerData: InsertUser = {
        ...req.body,
        role: "Manager"
      };
      const manager = await storage.createUser(managerData);
      
      // Log activity
      await storage.logActivity({
        userId: admin.id,
        action: "create_user",
        details: `Admin created manager: ${manager.firstName} ${manager.lastName} (ID: ${manager.id})`
      });
      
      res.status(201).json(manager);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/admin/managers/:id", isAuthenticated, hasRole(["Admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const manager = await storage.getUser(id);
      
      if (!manager) {
        return res.status(404).json({ message: "Manager not found" });
      }
      
      if (manager.role !== "Manager") {
        return res.status(400).json({ message: "User is not a manager" });
      }
      
      const updatedManager = await storage.updateUser(id, req.body);
      res.json(updatedManager);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/admin/managers/:id", isAuthenticated, hasRole(["Admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const manager = await storage.getUser(id);
      
      if (!manager) {
        return res.status(404).json({ message: "Manager not found" });
      }
      
      if (manager.role !== "Manager") {
        return res.status(400).json({ message: "User is not a manager" });
      }
      
      await storage.deactivateUser(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // These endpoints are now redundant with the ones defined above
  // Keeping them commented out for reference
  /*
  app.post("/api/admin/users/:id/activate", isAuthenticated, hasRole(["Admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.activateUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.post("/api/admin/users/:id/deactivate", isAuthenticated, hasRole(["Admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.deactivateUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });
  */

  app.get("/api/admin/help-requests", isAuthenticated, hasRole(["Admin"]), async (req, res) => {
    try {
      const resolved = req.query.resolved === 'true';
      const helpRequests = await storage.getHelpRequests(resolved);
      res.json(helpRequests);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/admin/help-requests/:id/resolve", isAuthenticated, hasRole(["Admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const helpRequest = await storage.resolveHelpRequest(id);
      
      if (!helpRequest) {
        return res.status(404).json({ message: "Help request not found" });
      }
      
      res.json(helpRequest);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // This is a duplicate of the above endpoint and can be removed
  /*
  app.get("/api/admin/activities", isAuthenticated, hasRole(["Admin"]), async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const activities = await storage.getActivities(page, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  */

  // Manager routes
  app.post("/api/manager/sales-staff", isAuthenticated, hasRole(["Manager"]), async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      const salesStaffData: InsertUser = {
        ...req.body,
        role: "SalesStaff",
        managerId: currentUser.id
      };
      
      const salesStaff = await storage.createUser(salesStaffData);
      
      // Log activity
      await storage.logActivity({
        userId: currentUser.id,
        action: "create_user",
        details: `Manager created sales staff: ${salesStaff.firstName} ${salesStaff.lastName} (ID: ${salesStaff.id})`
      });
      
      res.status(201).json(salesStaff);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/manager/sales-staff", isAuthenticated, hasRole(["Manager"]), async (req, res) => {
    try {
      const currentUser = req.user as User;
      const salesStaff = await storage.getUsersByManager(currentUser.id);
      
      // Filter to only get SalesStaff
      const filteredSalesStaff = salesStaff.filter(user => user.role === "SalesStaff");
      
      res.json(filteredSalesStaff);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/manager/sales-staff/:id", isAuthenticated, hasRole(["Manager"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUser = req.user as User;
      
      const salesStaff = await storage.getUser(id);
      
      if (!salesStaff) {
        return res.status(404).json({ message: "Sales staff not found" });
      }
      
      if (salesStaff.role !== "SalesStaff") {
        return res.status(400).json({ message: "User is not a sales staff" });
      }
      
      if (salesStaff.managerId !== currentUser.id) {
        return res.status(403).json({ message: "You can only update your own sales staff" });
      }
      
      const updatedSalesStaff = await storage.updateUser(id, req.body);
      res.json(updatedSalesStaff);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/manager/sales-staff/:id", isAuthenticated, hasRole(["Manager"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUser = req.user as User;
      
      const salesStaff = await storage.getUser(id);
      
      if (!salesStaff) {
        return res.status(404).json({ message: "Sales staff not found" });
      }
      
      if (salesStaff.role !== "SalesStaff") {
        return res.status(400).json({ message: "User is not a sales staff" });
      }
      
      if (salesStaff.managerId !== currentUser.id) {
        return res.status(403).json({ message: "You can only deactivate your own sales staff" });
      }
      
      await storage.deactivateUser(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/manager/agents", isAuthenticated, hasRole(["Manager"]), async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // Get all sales staff under this manager
      const salesStaff = await storage.getUsersByManager(currentUser.id);
      const salesStaffIds = salesStaff.map(staff => staff.id);
      
      // Get all agents under these sales staff
      let allAgents: User[] = [];
      
      for (const staffId of salesStaffIds) {
        const agents = await storage.getUsersByManager(staffId);
        allAgents = [...allAgents, ...agents];
      }
      
      // Filter to only get Agents and TeamLeaders
      const filteredAgents = allAgents.filter(user => 
        user.role === "Agent" || user.role === "TeamLeader"
      );
      
      res.json(filteredAgents);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // SalesStaff routes
  app.post("/api/sales-staff/agents", isAuthenticated, hasRole(["SalesStaff"]), async (req, res) => {
    try {
      const currentUser = req.user as User;
      const isTeamLeader = req.body.role === "TeamLeader";
      
      const agentData: InsertUser = {
        ...req.body,
        role: isTeamLeader ? "TeamLeader" : "Agent",
        managerId: currentUser.id
      };
      
      const agent = await storage.createUser(agentData);
      
      // Log activity
      await storage.logActivity({
        userId: currentUser.id,
        action: "create_user",
        details: `Sales staff created ${isTeamLeader ? 'team leader' : 'agent'}: ${agent.firstName} ${agent.lastName} (ID: ${agent.id})`
      });
      
      res.status(201).json(agent);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/sales-staff/agents", isAuthenticated, hasRole(["SalesStaff"]), async (req, res) => {
    try {
      const currentUser = req.user as User;
      const agents = await storage.getUsersByManager(currentUser.id);
      
      // Filter to only get Agents and TeamLeaders
      const filteredAgents = agents.filter(user => 
        user.role === "Agent" || user.role === "TeamLeader"
      );
      
      res.json(filteredAgents);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/sales-staff/agent-groups", isAuthenticated, hasRole(["SalesStaff"]), async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      const groupData: InsertAgentGroup = {
        ...req.body,
        salesStaffId: currentUser.id
      };
      
      const group = await storage.createAgentGroup(groupData);
      
      // Log activity
      await storage.logActivity({
        userId: currentUser.id,
        action: "create_group",
        details: `Sales staff created agent group: "${group.name}" (ID: ${group.id})`
      });
      
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/sales-staff/agent-groups", isAuthenticated, hasRole(["SalesStaff"]), async (req, res) => {
    try {
      const currentUser = req.user as User;
      const groups = await storage.getAgentGroupsBySalesStaff(currentUser.id);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/sales-staff/agent-groups/:groupId/members", isAuthenticated, hasRole(["SalesStaff"]), async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const currentUser = req.user as User;
      
      // Check if group belongs to this sales staff
      const group = await storage.getAgentGroup(groupId);
      
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      if (group.salesStaffId !== currentUser.id) {
        return res.status(403).json({ message: "You can only add members to your own groups" });
      }
      
      const memberData: InsertAgentGroupMember = {
        groupId,
        agentId: req.body.agentId
      };
      
      const member = await storage.addAgentToGroup(memberData);
      res.status(201).json(member);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/sales-staff/agent-groups/:groupId/members", isAuthenticated, hasRole(["SalesStaff", "TeamLeader"]), async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const currentUser = req.user as User;
      
      // Check if group belongs to this sales staff or if user is the team leader
      const group = await storage.getAgentGroup(groupId);
      
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      if (currentUser.role === "SalesStaff" && group.salesStaffId !== currentUser.id) {
        return res.status(403).json({ message: "You can only view members of your own groups" });
      }
      
      if (currentUser.role === "TeamLeader" && group.leaderId !== currentUser.id) {
        return res.status(403).json({ message: "You can only view members of groups you lead" });
      }
      
      const members = await storage.getAgentsByGroup(groupId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/sales-staff/agent-groups/:id", isAuthenticated, hasRole(["SalesStaff"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUser = req.user as User;
      
      const group = await storage.getAgentGroup(id);
      
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      if (group.salesStaffId !== currentUser.id) {
        return res.status(403).json({ message: "You can only update your own groups" });
      }
      
      const updatedGroup = await storage.updateAgentGroup(id, req.body);
      res.json(updatedGroup);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Agent routes
  app.post("/api/agent/attendance", isAuthenticated, hasRole(["Agent", "TeamLeader"]), async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      const attendanceData: InsertAttendance = {
        ...req.body,
        userId: currentUser.id,
        date: new Date()
      };
      
      const attendance = await storage.createAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/agent/attendance", isAuthenticated, hasRole(["Agent", "TeamLeader", "SalesStaff", "Manager"]), async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // If agent or team leader, only show their own attendance
      if (currentUser.role === "Agent" || currentUser.role === "TeamLeader") {
        const date = req.query.date ? new Date(req.query.date as string) : new Date();
        const attendance = await storage.getAttendanceByUserAndDate(currentUser.id, date);
        return res.json(attendance || null);
      }
      
      // If sales staff, show attendance for all their agents
      if (currentUser.role === "SalesStaff") {
        const date = req.query.date ? new Date(req.query.date as string) : new Date();
        const agents = await storage.getUsersByManager(currentUser.id);
        const agentIds = agents.map(agent => agent.id);
        
        const allAttendance = await storage.getAttendanceByDate(date);
        const filteredAttendance = allAttendance.filter(a => agentIds.includes(a.userId));
        
        return res.json(filteredAttendance);
      }
      
      // If manager, show all attendance
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const allAttendance = await storage.getAttendanceByDate(date);
      res.json(allAttendance);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/agent/clients", isAuthenticated, hasRole(["Agent", "TeamLeader"]), async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      const clientData: InsertClient = {
        ...req.body,
        agentId: currentUser.id
      };
      
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/agent/clients", isAuthenticated, hasRole(["Agent", "TeamLeader", "SalesStaff"]), async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // If agent or team leader, only show their own clients
      if (currentUser.role === "Agent" || currentUser.role === "TeamLeader") {
        const clients = await storage.getClientsByAgent(currentUser.id);
        return res.json(clients);
      }
      
      // If sales staff, show clients for all their agents
      if (currentUser.role === "SalesStaff") {
        const agents = await storage.getUsersByManager(currentUser.id);
        let allClients: any[] = [];
        
        for (const agent of agents) {
          const agentClients = await storage.getClientsByAgent(agent.id);
          allClients = [...allClients, ...agentClients];
        }
        
        return res.json(allClients);
      }
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/agent/clients/:id", isAuthenticated, hasRole(["Agent", "TeamLeader"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUser = req.user as User;
      
      const client = await storage.getClient(id);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      if (client.agentId !== currentUser.id) {
        return res.status(403).json({ message: "You can only update your own clients" });
      }
      
      const updatedClient = await storage.updateClient(id, req.body);
      res.json(updatedClient);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.post("/api/agent/daily-reports", isAuthenticated, hasRole(["Agent", "TeamLeader"]), async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      const reportData: InsertDailyReport = {
        ...req.body,
        agentId: currentUser.id,
        date: new Date()
      };
      
      const report = await storage.createDailyReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Messages
  app.post("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const receiverId = parseInt(req.body.receiverId);
      
      // Get receiver to check their role
      const receiver = await storage.getUser(receiverId);
      
      if (!receiver) {
        return res.status(404).json({ message: "Receiver not found" });
      }
      
      // Check messaging permissions based on roles
      const senderRole = currentUser.role;
      const receiverRole = receiver.role;
      
      let isAllowed = false;
      
      if (senderRole === "Admin" && (receiverRole === "Manager")) {
        isAllowed = true;
      } else if (senderRole === "Manager" && (receiverRole === "SalesStaff" || receiverRole === "Admin")) {
        isAllowed = true;
      } else if (senderRole === "SalesStaff" && (receiverRole === "Agent" || receiverRole === "TeamLeader" || receiverRole === "Manager")) {
        // If receiver is agent, check if they report to this sales staff
        if (receiverRole === "Agent" || receiverRole === "TeamLeader") {
          isAllowed = receiver.managerId === currentUser.id;
        } else {
          isAllowed = true;
        }
      } else if (senderRole === "TeamLeader" && receiverRole === "SalesStaff") {
        // Team leaders can only message their sales staff
        isAllowed = receiver.id === currentUser.managerId;
      } else if (senderRole === "Agent" && receiverRole === "SalesStaff") {
        // Agents can only message their sales staff
        isAllowed = receiver.id === currentUser.managerId;
      }
      
      if (!isAllowed) {
        return res.status(403).json({ message: "You are not allowed to message this user" });
      }
      
      const messageData: InsertMessage = {
        senderId: currentUser.id,
        receiverId,
        content: req.body.content
      };
      
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const messages = await storage.getMessagesByUser(currentUser.id);
      
      // Get user info for all senders and receivers
      const userIds = new Set<number>();
      messages.forEach(msg => {
        userIds.add(msg.senderId);
        userIds.add(msg.receiverId);
      });
      
      const userMap = new Map<number, User>();
      for (const id of userIds) {
        const user = await storage.getUser(id);
        if (user) {
          userMap.set(id, user);
        }
      }
      
      // Augment messages with user info
      const augmentedMessages = messages.map(msg => ({
        ...msg,
        sender: userMap.get(msg.senderId) ? {
          id: userMap.get(msg.senderId)!.id,
          firstName: userMap.get(msg.senderId)!.firstName,
          lastName: userMap.get(msg.senderId)!.lastName,
          role: userMap.get(msg.senderId)!.role,
        } : null,
        receiver: userMap.get(msg.receiverId) ? {
          id: userMap.get(msg.receiverId)!.id,
          firstName: userMap.get(msg.receiverId)!.firstName,
          lastName: userMap.get(msg.receiverId)!.lastName,
          role: userMap.get(msg.receiverId)!.role,
        } : null
      }));
      
      res.json(augmentedMessages);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/messages/:id/read", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUser = req.user as User;
      
      const message = await storage.getMessage(id);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      if (message.receiverId !== currentUser.id) {
        return res.status(403).json({ message: "You can only mark messages sent to you as read" });
      }
      
      const updatedMessage = await storage.markMessageAsRead(id);
      res.json(updatedMessage);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/users/available-receivers", isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as User;
      let availableReceivers: User[] = [];
      
      switch (currentUser.role) {
        case "Admin":
          // Admin can message Managers
          availableReceivers = await storage.getUsers("Manager");
          break;
        case "Manager":
          // Manager can message SalesStaff and Admin
          const salesStaff = await storage.getUsersByManager(currentUser.id);
          const admin = await storage.getUsers("Admin");
          availableReceivers = [...salesStaff, ...admin];
          break;
        case "SalesStaff":
          // SalesStaff can message Agents, TeamLeaders, and Manager
          const agents = await storage.getUsersByManager(currentUser.id);
          const manager = await storage.getUser(currentUser.managerId || 0);
          availableReceivers = agents;
          if (manager) {
            availableReceivers.push(manager);
          }
          break;
        case "TeamLeader":
        case "Agent":
          // TeamLeader and Agent can message their SalesStaff
          const salesStaffManager = await storage.getUser(currentUser.managerId || 0);
          if (salesStaffManager) {
            availableReceivers = [salesStaffManager];
          }
          break;
      }
      
      // Simplify user objects for the response
      const simplifiedReceivers = availableReceivers.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        workId: user.workId
      }));
      
      res.json(simplifiedReceivers);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
