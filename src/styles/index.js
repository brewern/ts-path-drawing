import styled from '@emotion/styled'
import { css } from '@emotion/react'

const COLUMN_START_LEFT = 100

export const Column = styled.div`
  background-color: #fff;
  width: 100%;
  max-width: 330px;
  height: 150px;
  box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.10);
  /* position: relative; */
  display: flex;
  flex-direction: column;
  gap: 3px;

  position: absolute;
  top: 60px;
  left: ${COLUMN_START_LEFT}px;
  z-index: 2;

  ${props => props.position > 1 && css`
    left: ${BOX_WIDTH * (props.position - 1) + ((props.position - 1) * 80) + COLUMN_START_LEFT}px;
  `}
`

const BOX_WIDTH = 330

export const Box = styled.div`
  background-color: #fff;
  width: 100%;
  max-width: ${BOX_WIDTH}px;
  height: 150px;
  box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.10);
  /* position: relative; */
  display: flex;
  flex-direction: column;
  gap: 3px;

  position: absolute;
  top: 420px;
  left: 0;
  z-index: 2;

  ${props => props.position > 1 && css`
    left: ${BOX_WIDTH * (props.position - 1) + ((props.position - 1) * 30)}px;
  `}
`

export const NodeItem = styled.div`
  position: relative;
  padding: 3px 10px;

  span {
    position: absolute;
    width: 3px;
    height: 18px;
    background-color: blue;

    ${props => props.dir === "right" && css`
      right: -3px;
    `}

    ${props => props.dir === "left" && css`
      left: -3px;
    `}
  }
`

export const Node = styled.div`
  width: var(--dot-dimension);
  height: var(--dot-dimension);
  background-color: #aaa;
  border-radius: var(--dot-dimension);
  position: absolute;
  top: calc(2 * var(--dot-space) - var(--dot-dimension));

  ${props => props.dir === "left" && css`
    left: -5px;
  `}

  ${props => props.dir === "right" && css`
    right: -5px;
  `}

  ${props => props.dir === "top" && css`
    top: -5px;
    left: 50%;
    translate: calc(50% - 5px) 0;
  `}
`
