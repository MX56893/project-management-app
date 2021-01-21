import User from './models/user.js';
import Task from './models/task.js';
import Project from './models/project.js';
import List from './models/list.js';
import mongoose from 'mongoose';
import {
  authorizeSocketConnection,
  levelOneAuth,
  levelTwoAuth,
} from './middleware/socketMiddleware.js';

export const socket = (io) => {
  io.on('connection', async (socket) => {
    // Authorize user upon initial connection
    await authorizeSocketConnection(socket.handshake.auth, socket);
    console.log('Connected users:', io.sockets.server.eio.clientsCount);

    socket.on('join-board', async ({ room }) => {
      // Check is user is part of the project
      await levelOneAuth({ projectId: room }, socket);
      console.log('Joined board', room);
      socket.join(room);
    });

    socket.on('disconnect-board', ({ room }) => {
      console.log('Disconnected-board', room);
      socket.leave(room);
    });

    // Board actions

    socket.on('add-task', async (data, callback) => {
      const taskId = mongoose.Types.ObjectId();
      const createdTask = new Task({
        _id: taskId,
        title: data.title,
        description: '',
        deadline: null,
        comments: [],
        labels: [],
        users: [],
        author: socket.user.username,
        creatorId: socket.user._id,
        projectId: data.projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      io.to(data.projectId).emit('new-task', {
        task: createdTask,
        listId: data.listId,
      });

      callback();

      await List.findOneAndUpdate(
        { projectId: data.projectId, 'lists._id': data.listId },
        { $push: { [`lists.$.tasks`]: taskId } }
      );
      await createdTask.save();
    });

    socket.on('task-move', async (data) => {
      const { removed, added, taskId, projectId } = data;
      let lists;
      if (removed.listIndex === added.listIndex) {
        await List.updateOne(
          { projectId },
          {
            $pull: {
              [`lists.${removed.listIndex}.tasks`]: taskId,
            },
          }
        );
        lists = await List.findOneAndUpdate(
          { projectId },
          {
            $push: {
              [`lists.${added.listIndex}.tasks`]: {
                $each: [taskId],
                $position: added.index,
              },
            },
          },
          { returnOriginal: false }
        )
          .populate('lists.tasks')
          .populate('archivedTasks');
      } else {
        lists = await List.findOneAndUpdate(
          { projectId },
          {
            $pull: {
              [`lists.${removed.listIndex}.tasks`]: taskId,
            },
            $push: {
              [`lists.${added.listIndex}.tasks`]: {
                $each: [taskId],
                $position: added.index,
              },
            },
          },
          { returnOriginal: false }
        )
          .populate('lists.tasks')
          .populate('archivedTasks');
      }
      socket.to(projectId).emit('lists-update', lists);
    });

    socket.on('add-list', async (data, callback) => {
      const newList = {
        _id: mongoose.Types.ObjectId(),
        title: data.title,
        tasks: [],
      };
      io.to(data.projectId).emit('list-added', {
        list: newList,
      });
      callback();
      await List.updateOne(
        { projectId: data.projectId },
        { $push: { lists: newList } }
      );
    });

    socket.on('list-move', async (data) => {
      const { removedIndex, addedIndex, projectId } = data;
      const lists = await List.findOne({ projectId })
        .populate('lists.tasks')
        .populate('archivedTasks');
      const [list] = lists.lists.splice(removedIndex, 1);
      lists.lists.splice(addedIndex, 0, list);
      await lists.save();
      socket.to(projectId).emit('lists-update', lists);
    });

    socket.on('list-title-update', async (data, callback) => {
      const { title, listIndex, projectId } = data;
      callback();
      socket.to(projectId).emit('list-title-updated', { title, listIndex });
      await List.updateOne(
        { projectId },
        { $set: { [`lists.${listIndex}.title`]: title } }
      );
    });

    socket.on('project-title-update', async (data, callback) => {
      const { title, projectId } = data;
      callback();
      socket.to(projectId).emit('project-title-updated', { title, projectId });
      await Project.updateOne({ _id: projectId }, { $set: { title: title } });
    });

    socket.on('task-archive', async (data, callback) => {
      const { projectId, taskId, listIndex } = data;
      socket.to(projectId).emit('task-archived', { taskId, listIndex });
      await List.updateOne(
        { projectId },
        {
          $pull: {
            [`lists.${listIndex}.tasks`]: taskId,
          },
          $push: { archivedTasks: taskId },
        }
      );
      await Task.updateOne({ _id: taskId }, { $set: { archived: true } });
    });
    socket.on('task-delete', async (data, callback) => {
      const { projectId, taskId } = data;
      callback();
      await List.updateOne(
        { projectId },
        {
          $pull: {
            archivedTasks: taskId,
          },
        }
      );
      socket.to(projectId).emit('task-deleted', { taskId, listIndex });
    });

    socket.on('tasks-archive', async (data) => {
      const { projectId, listIndex } = data;
      const lists = await List.findOne({ projectId });
      const tasks = lists.lists[listIndex].tasks.splice(
        0,
        lists.lists[listIndex].tasks.length
      );

      if (tasks.length > 0) {
        await Task.updateMany(
          { _id: { $in: tasks } },
          { $set: { archived: true } },
          { multi: true }
        );
        lists.archivedTasks = [...lists.archivedTasks, ...tasks];
      }
      await lists.save();
      const newLists = await List.findOne({ projectId })
        .populate('lists.tasks')
        .populate('archivedTasks');
      socket.to(projectId).emit('lists-update', { lists: newLists });
    });

    socket.on('list-delete', async (data) => {
      const { projectId, listIndex } = data;
      const lists = await List.findOne({ projectId });

      const [deletedList] = lists.lists.splice(listIndex, 1);
      if (deletedList.tasks.length > 0) {
        await Task.updateMany(
          { _id: { $in: deletedList.tasks } },
          { $set: { archived: true } },
          { multi: true }
        );
        lists.archivedTasks = [...lists.archivedTasks, ...deletedList.tasks];
      }
      await lists.save();
      const newLists = await List.findOne({ projectId })
        .populate('lists.tasks')
        .populate('archivedTasks');
      socket.to(projectId).emit('lists-update', { lists: newLists });
    });
  });
  io.on('disconnect', (socket) => {
    console.log('User disconnected.');
  });
};
