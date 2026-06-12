const db = require('../utils/dbHelper');

// Get All Workspaces for Current User
exports.getWorkspaces = async (req, res) => {
  try {
    const workspaces = await db.workspace.find({ 'members.userId': req.user.id });
    res.json(workspaces);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Create a New Workspace
exports.createWorkspace = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Workspace name is required' });
  }

  try {
    const newWorkspace = await db.workspace.create({
      name: name.trim(),
      ownerId: req.user.id,
      members: [
        {
          userId: req.user.id,
          role: 'Owner'
        }
      ]
    });

    // Log Activity
    await db.activity.create({
      userId: req.user.id,
      workspaceId: newWorkspace._id,
      action: 'WORKSPACE_CREATE',
      description: `Created team workspace "${newWorkspace.name}"`
    });

    res.status(201).json(newWorkspace);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Invite Member to Workspace by Email
exports.inviteMember = async (req, res) => {
  const { email, role } = req.body;
  const workspaceId = req.params.id;

  if (!email) {
    return res.status(400).json({ message: 'Email address is required' });
  }

  try {
    const workspace = await db.workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check permissions (Only Owner or Admin can invite members)
    const operator = workspace.members.find(m => m.userId.toString() === req.user.id);
    if (!operator || (operator.role !== 'Owner' && operator.role !== 'Admin')) {
      return res.status(403).json({ message: 'Unauthorized. Only workspace Owners/Admins can invite members' });
    }

    // Find user by email
    const targetUser = await db.user.findOne({ email });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found on this platform' });
    }

    // Check if user is already a member
    const alreadyMember = workspace.members.some(m => m.userId.toString() === targetUser._id.toString() || m.userId.toString() === targetUser.id?.toString());
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this workspace' });
    }

    // Add member
    workspace.members.push({
      userId: targetUser.id || targetUser._id,
      role: role || 'Member'
    });

    await db.workspace.findByIdAndUpdate(workspaceId, { members: workspace.members });

    // Send Alert Notification to user
    await db.notification.create({
      userId: targetUser.id || targetUser._id,
      type: 'INFO',
      title: 'Workspace Invitation',
      message: `You have been added to the team workspace "${workspace.name}"`
    });

    // Log Activity
    await db.activity.create({
      userId: req.user.id,
      workspaceId: workspace._id,
      action: 'MEMBER_INVITE',
      description: `Invited user "${targetUser.email}" to "${workspace.name}"`
    });

    res.json({ message: `Successfully added ${email} to workspace`, workspace });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Remove Member from Workspace
exports.removeMember = async (req, res) => {
  const { memberId } = req.body;
  const workspaceId = req.params.id;

  try {
    const workspace = await db.workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Only Owner or Admin can remove members. Members can remove themselves.
    const operator = workspace.members.find(m => m.userId.toString() === req.user.id);
    if (!operator) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const isSelf = memberId.toString() === req.user.id;
    if (!isSelf && operator.role !== 'Owner' && operator.role !== 'Admin') {
      return res.status(403).json({ message: 'Only workspace Owners or Admins can remove members' });
    }

    // If removing the Owner
    const targetMember = workspace.members.find(m => m.userId.toString() === memberId.toString());
    if (targetMember && targetMember.role === 'Owner' && workspace.ownerId.toString() === memberId.toString()) {
      return res.status(400).json({ message: 'Cannot remove the primary Owner of this workspace' });
    }

    // Remove
    workspace.members = workspace.members.filter(m => m.userId.toString() !== memberId.toString());
    await db.workspace.findByIdAndUpdate(workspaceId, { members: workspace.members });

    // Send Alert Notification to removed user
    await db.notification.create({
      userId: memberId,
      type: 'WARNING',
      title: 'Workspace Access Revoked',
      message: `You were removed from the workspace "${workspace.name}"`
    });

    // Log Activity
    await db.activity.create({
      userId: req.user.id,
      workspaceId: workspace._id,
      action: 'MEMBER_REMOVE',
      description: `Removed member ${memberId} from workspace "${workspace.name}"`
    });

    res.json({ message: 'Member successfully removed', workspace });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Delete Workspace
exports.deleteWorkspace = async (req, res) => {
  const workspaceId = req.params.id;

  try {
    const workspace = await db.workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Only Owner can delete workspace
    if (workspace.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized. Only the workspace Owner can delete this workspace' });
    }

    await db.workspace.findByIdAndDelete(workspaceId);

    // Log Activity
    await db.activity.create({
      userId: req.user.id,
      action: 'WORKSPACE_DELETE',
      description: `Deleted workspace "${workspace.name}"`
    });

    res.json({ message: 'Workspace and all associated links deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};
