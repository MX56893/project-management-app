import React from 'react';
import { useHistory } from 'react-router-dom';

import { makeStyles, Modal } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

import TaskHeader from './modalComponents/TaskHeader';
import TaskDescription from './modalComponents/TaskDescription';
import SideContent from './modalComponents/SideContent';
import Deadline from './modalComponents/Deadline';
import Users from './modalComponents/users/Users';

const useStyles = makeStyles((theme) => ({
  container: {
    position: 'relative',
    overflow: 'auto',
    borderRadius: 5,
    height: '90vh',
    maxWidth: 700,
    margin: '5vh auto',
    outline: 'none',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    padding: '25px 10px 20px 20px',
    backgroundColor: '#f4f5f7',
    [theme.breakpoints.down(720)]: {
      margin: '5vh 10px',
    },
  },
  innerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 10,
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      height: '100%',
    },
  },
  closeIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    padding: 3,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
}));

const TaskModal = ({ task, userPermissions }) => {
  const history = useHistory();
  const classes = useStyles();

  const closeHandle = () => history.push(`/project/${task.projectId}`);

  return (
    <Modal
      disableEnforceFocus
      open={Boolean(task)}
      disableScrollLock
      onClose={closeHandle}
    >
      <div className={classes.container}>
        {task && (
          <>
            <TaskHeader task={task} initialDescription={task.description} />
            <div className={classes.innerContainer}>
              <div style={{ width: '100%' }}>
                <Users
                  selectedUsers={task.users}
                  projectId={task.projectId}
                  taskId={task._id}
                />
                <TaskDescription
                  userPermissions={userPermissions}
                  task={task}
                />
                <Deadline task={task} />
              </div>
              <SideContent task={task} />
            </div>
          </>
        )}

        <CloseIcon className={classes.closeIcon} onClick={closeHandle} />
      </div>
    </Modal>
  );
};

export default TaskModal;