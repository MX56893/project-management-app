import React, { useState } from 'react';

import { Menu, MenuItem } from '@material-ui/core';

import DeleteMenu from '../../../shared/DeleteMenu';
import MenuHeader from '../../../shared/MenuHeader';

const ToDoMenu = ({
  deleteListHandle,
  hideHandle,
  showHandle,
  tasksFinished,
  hideTasks,
  anchorEl,
  closeHandle,
}) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const handleClose = () => {
    setDeleteOpen(false);
    closeHandle();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      keepMounted
      open={Boolean(anchorEl)}
      onClose={handleClose}
      getContentAnchorEl={null}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      transitionDuration={0}
    >
      <div style={{ outline: 'none' }}>
        {deleteOpen ? (
          <DeleteMenu
            Header={
              <MenuHeader
                title='Delete To-Do List?'
                goBackHandle={() => setDeleteOpen(false)}
                handleClose={handleClose}
              />
            }
            deleteHandle={deleteListHandle}
            text='Deleting a To-Do list is permament and cannot be undone.'
          />
        ) : (
          <>
            <MenuHeader title='To-Do List Actions' handleClose={handleClose} />
            <div style={{ width: 270, padding: '6px 9px 0 9px' }}>
              <MenuItem
                style={{ marginTop: 5 }}
                onClick={hideTasks ? hideHandle() : showHandle()}
              >
                {hideTasks
                  ? 'Hide Finished Tasks'
                  : tasksFinished === 0
                  ? 'Show Finished Tasks'
                  : `Show Finished Tasks (${tasksFinished})`}
              </MenuItem>
              <MenuItem onClick={() => setDeleteOpen(true)}>Delete</MenuItem>
            </div>
          </>
        )}
      </div>
    </Menu>
  );
};

export default ToDoMenu;