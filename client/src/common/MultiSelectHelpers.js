import React from 'react';
import matchSorter from 'match-sorter';

const allItems = [{ name: 'foo', id: '1' }, { name: 'bar', id: '2' }];

const Item = function Item({ isActive, isSelected, ...rest }) {
  let style = {
    position: 'relative',
    cursor: 'pointer',
    display: 'block',
    border: 'none',
    height: 'auto',
    textAlign: 'left',
    borderTop: 'none',
    lineHeight: '1em',
    color: 'rgba(0,0,0,.87)',
    fontSize: '1rem',
    textTransform: 'none',
    fontWeight: '400',
    boxShadow: 'none',
    padding: '.8rem 1.1rem',
    whiteSpace: 'normal',
    wordWrap: 'normal'
  };

  if (isActive) {
    Object.assign(style, {
      color: 'rgba(0,0,0,.95)',
      background: 'rgba(0,0,0,.03)'
    });
  }

  if (isSelected) {
    Object.assign(style, {
      color: 'rgba(0,0,0,.95)',
      fontWeight: '700'
    });
  }
  return <li style={style} {...rest} />;
};

const Menu = React.forwardRef(({ isOpen, ...rest }, ref) => {
  const style = {
    padding: 0,
    marginTop: 0,
    position: 'absolute',
    backgroundColor: 'white',
    width: '100%',
    maxHeight: '20rem',
    overflowY: 'auto',
    overflowX: 'hidden',
    outline: '0',
    transition: 'opacity .1s ease',
    borderRadius: '0 0 2px 2px',
    boxShadow: '0 2px 3px 0 rgba(34,36,38,.15)',
    borderColor: '#96c8da',
    borderTopWidth: '0',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderStyle: 'solid',
    zIndex: 99999
  };
  if (!isOpen) {
    style.border = 'none';
  }
  return <ul ref={ref} style={style} {...rest} />;
});

function getItems(filter) {
  return filter
    ? matchSorter(allItems, filter, {
        keys: ['name']
      })
    : allItems;
}

export { Menu, Item, getItems };
