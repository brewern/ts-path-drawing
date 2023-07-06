import { useEffect, useState, useRef } from 'react'
import { PathBuilder, getNodePosition } from './utils/draw'
import { IConnectNode } from './utils/types'
import * as css from './styles'

const CoordinateModal = () => {
  const [coords, setCoords] = useState({
    x: 0,
    y: 0,
  })

  useEffect(() => {
    function showMouseCoordinates(e) {
      setCoords({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', showMouseCoordinates)

    return () => {
      window.removeEventListener('mousemove', showMouseCoordinates)
    }
  }, [])

  return (
    <div className="coordinate-modal">
      x: {coords.x} :: y: {coords.y}
    </div>
  )
}

export function App() {
  const [connections, setConnections] = useState<IConnectNode[]>([])

  useEffect(() => {
    const startNodes = document.querySelectorAll('.start-node')
    const connections: IConnectNode[] = []

    // Convert HTML Element nodes to connective path coordinates.
    startNodes.forEach(node => {
      const endNodeName = (node as HTMLElement).dataset.connectTo
      const direction = (node as HTMLElement).dataset.connectDir || 'left'
      const startNodeElem = node.querySelector("span")
      const endNodeElem = endNodeName && document.querySelector(`[data-connect-name="${endNodeName}"]`)

      if (!startNodeElem || !endNodeElem) {
        console.error("Node not found in DOM")
        return
      }

      const startCoords = getNodePosition(startNodeElem)
      const endCoords = getNodePosition(endNodeElem)
      
      connections.push({ start: startCoords, end: endCoords, direction })
    })

    setConnections(connections)
  }, []);

  useEffect(() => {
    const allColumns = document.querySelectorAll('.column')

    new PathBuilder(connections, allColumns)
  }, [connections])

  const columns = [
    { position: 1, nodes: [{ dir: 'left', pos: 1 }, { dir: 'right', pos: 2 }, { dir: 'right', pos: 3 }] },
    { position: 2, nodes: [{ dir: 'left', pos: 4 }, { dir: 'right', pos: 5 }, { dir: 'right', pos: 6 }] },
  ]

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <section className="grid-container" id="grid-container">
        <div style={{ position: 'relative', padding: 30 }}>
          <CoordinateModal />

          {columns.map((col, _index) => (
            <css.Column className="column" position={col.position} key={col.position}>
              {col.nodes.map((node, index) => (
                  <css.NodeItem
                    key={`${col.position}-${node.pos}`}
                    className="start-node"
                    dir={node.dir}
                    position={node.pos}
                    data-connect-to={`node${node.pos}`}
                    data-connect-dir={node.dir}
                  ><span></span>Connector {index+1}</css.NodeItem>
              ))}
            </css.Column>
          ))}

          {[1, 2, 3, 4, 5, 6].map((i) => (
            <css.Box position={i} key={i}>
              <css.Node
                dir="top"
                data-connect-name={`node${i}`}
              />
            </css.Box>
          ))}
        </div>

      </section>
    </div>
  );
}
