import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useReducedMotion } from 'framer-motion'
import { useIsMobile } from '../hooks/useMediaQuery'

interface InstanceData {
  position: THREE.Vector3
  rotation: THREE.Euler
  rotSpeed: { x: number; y: number }
  scale: number
  bobSpeed: number
  bobOffset: number
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function makeInstances(count: number): InstanceData[] {
  return Array.from({ length: count }, () => ({
    position: new THREE.Vector3(rand(-18, 18), rand(-10, 10), rand(-8, -2)),
    rotation: new THREE.Euler(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI)),
    rotSpeed: { x: rand(0.001, 0.003), y: rand(0.001, 0.002) },
    scale: rand(0.08, 0.35),
    bobSpeed: rand(0.4, 1.1),
    bobOffset: rand(0, Math.PI * 2),
  }))
}

function Field({ total, parallax }: { total: number; parallax: boolean }) {
  const reduce = useReducedMotion()
  const accentCount = Math.min(6, Math.floor(total * 0.08))
  const darkCount = total - accentCount

  const darkData = useMemo(() => makeInstances(darkCount), [darkCount])
  const accentData = useMemo(() => makeInstances(accentCount), [accentCount])

  const darkRef = useRef<THREE.InstancedMesh>(null)
  const accentRef = useRef<THREE.InstancedMesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const { size } = useThree()
  const mouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!parallax) return
    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [parallax])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const writeMesh = (mesh: THREE.InstancedMesh | null, data: InstanceData[]) => {
      if (!mesh) return
      for (let i = 0; i < data.length; i++) {
        const d = data[i]
        if (!reduce) {
          d.rotation.x += d.rotSpeed.x
          d.rotation.y += d.rotSpeed.y
        }
        const bob = reduce ? 0 : Math.sin(t * d.bobSpeed + d.bobOffset) * 0.3
        dummy.position.set(d.position.x, d.position.y + bob, d.position.z)
        dummy.rotation.copy(d.rotation)
        dummy.scale.setScalar(d.scale)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    }
    writeMesh(darkRef.current, darkData)
    writeMesh(accentRef.current, accentData)

    if (groupRef.current && parallax && !reduce) {
      const targetY = (mouse.current.x / size.width - 0.5) * 0.3
      const targetX = (mouse.current.y / size.height - 0.5) * -0.15
      groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.03
      groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.03
    }
  })

  return (
    <group ref={groupRef}>
      <instancedMesh ref={darkRef} args={[undefined, undefined, darkCount]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.8} metalness={0.2} />
      </instancedMesh>
      <instancedMesh ref={accentRef} args={[undefined, undefined, accentCount]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#C8F135" roughness={0.8} metalness={0.2} transparent opacity={0.6} />
      </instancedMesh>
    </group>
  )
}

export default function Background3D({ embedded = false }: { embedded?: boolean }) {
  const isMobile = useIsMobile()
  const total = isMobile ? 24 : 64
  const parallax = !isMobile

  return (
    <div
      style={
        embedded
          ? { position: 'absolute', inset: 0, pointerEvents: 'none' }
          : { position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }
      }
      aria-hidden
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
        <Field total={total} parallax={parallax} />
      </Canvas>
    </div>
  )
}
