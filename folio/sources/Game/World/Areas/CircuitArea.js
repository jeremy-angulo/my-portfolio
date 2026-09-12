import * as THREE from 'three/webgpu'
import { Game } from '../../Game.js'
import { lerp, segmentCircleIntersection } from '../../utilities/maths.js'
import { InteractivePoints } from '../../InteractivePoints.js'
import gsap from 'gsap'
import { Player } from '../../Player.js'
import { MeshDefaultMaterial } from '../../Materials/MeshDefaultMaterial.js'
import { add, color, float, Fn, max, mix, normalGeometry, objectPosition, PI, positionGeometry, positionWorld, rotateUV, sin, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'
import { alea } from 'seedrandom'
import { Area } from './Area.js'
import { t } from '../../I18n.js'
import { timeToRaceString, timeToReadableString } from '../../utilities/time.js'
import { CircuitScores } from '../../CircuitScores.js'

// Les noms viennent du serveur, qui n'accepte que des lettres — l'échappement
// est une ceinture de plus avant de les injecter dans le menu.
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]))

export class CircuitArea extends Area
{
    static STATE_PENDING = 1
    static STATE_STARTING = 2
    static STATE_RUNNING = 3
    static STATE_ENDING = 4

    constructor(model)
    {
        super(model)

        // Debug
        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '🛞 Circuit',
                expanded: false,
            })
        }

        this.state = CircuitArea.STATE_PENDING

        // Tableau public des meilleurs temps (repli local si injoignable)
        this.scores = new CircuitScores()

        this.setSounds()
        this.setStartPosition()
        this.setStartingLights()
        this.setTimer()
        this.setCheckpoints()
        this.setResetObjects()
        this.setObstacles()
        this.setRoad()
        this.setRails()
        this.setInteractivePoint()
        this.setStartAnimation()
        this.setRespawn()
        this.setBounds()
        this.setAirDancers()
        this.setBanners()
        this.setMenu()
        this.setEndModal()
        this.setLeaderboard()
        this.setResetTime()
        this.setPodium()
        this.setData()
        this.setAchievement()

        this.game.materials.getFromName('circuitBrand').map.minFilter = THREE.LinearFilter
        this.game.materials.getFromName('circuitBrand').map.magFilter = THREE.LinearFilter
    }

    setSounds()
    {
        this.sounds = {}

        this.sounds.countdown1 = this.game.audio.register({
            path: 'sounds/circuit/countdown/Game Start Countdown 31-1.mp3',
            autoplay: false,
            loop: false,
            volume: 0.5,
            antiSpam: 0.1
        })

        this.sounds.countdown2 = this.game.audio.register({
            path: 'sounds/circuit/countdown/Game Start Countdown 31-2.mp3',
            autoplay: false,
            loop: false,
            volume: 0.5,
            antiSpam: 0.1
        })

        this.sounds.checkpoint = this.game.audio.register({
            path: 'sounds/circuit/checkpoint/Win Score 1.mp3',
            autoplay: false,
            loop: false,
            volume: 0.5,
            antiSpam: 0.1,
            onPlay: (item, reachedCount) =>
            {
                item.rate = 1 + (reachedCount - 1) * 0.06
            }
        })

        this.sounds.finish = this.game.audio.register({
            path: 'sounds/circuit/finish/Big Win Fanfare 2.mp3',
            autoplay: false,
            loop: false,
            volume: 0.5,
            antiSpam: 0.1
        })

        this.sounds.applause = this.game.audio.register({
            path: 'sounds/circuit/applause/huge win.mp3',
            autoplay: false,
            loop: false,
            volume: 0.5,
            antiSpam: 0.1
        })
    }

    setStartPosition()
    {
        const baseStart = this.references.items.get('start')[0]

        this.startPosition = {}
        this.startPosition.position = baseStart.position.clone()
        this.startPosition.rotation = baseStart.rotation.y
    }

    setStartingLights()
    {
        this.startingLights = {}
        this.startingLights.mesh = this.references.items.get('startingLights')[0]
        this.startingLights.mesh.visible = false
        this.startingLights.redMaterial = this.game.materials.getFromName('emissiveOrangeRadialGradient')
        this.startingLights.greenMaterial = this.game.materials.getFromName('emissiveGreenRadialGradient')
        this.startingLights.baseZ = this.startingLights.mesh.position.z

        // this.startingLights.mesh.visible = true
        // this.startingLights.mesh.position.z = this.startingLights.baseZ + 0.03
        // this.startingLights.mesh.material = this.startingLights.greenMaterial
        
        this.startingLights.reset = () =>
        {
            this.startingLights.mesh.visible = false
            this.startingLights.mesh.material = this.startingLights.redMaterial
        }
    }

    setTimer()
    {
        this.timer = {}

        this.timer.visible = true
        this.timer.startTime = 0
        this.timer.elapsedTime = 0
        this.timer.running = false
        this.timer.group = this.references.items.get('timer')[0]
        this.timer.group.rotation.y = Math.PI * 0.1
        this.timer.group.visible = false
        this.timer.defaultPosition = this.timer.group.position.clone()

        // Digits
        {
            this.timer.digits = {}
            this.timer.digits.ratio = 6
            this.timer.digits.height = 32
            this.timer.digits.width = 32 * 6
            
            // Canvas
            const font = `700 ${this.timer.digits.height}px "Nunito"`

            const canvas = document.createElement('canvas')
            canvas.style.position = 'fixed'
            canvas.style.zIndex = 999
            canvas.style.top = 0
            canvas.style.left = 0
            // document.body.append(canvas)

            const context = canvas.getContext('2d')
            context.font = font

            canvas.width = this.timer.digits.height * this.timer.digits.ratio
            canvas.height = this.timer.digits.height

            context.fillStyle = '#000000'
            context.fillRect(0, 0, canvas.width, canvas.height)

            context.font = font
            context.fillStyle = '#ffffff'
            context.textAlign = 'center'
            context.textBaseline = 'middle'
            context.fillText('00:00:000', this.timer.digits.width * 0.5, this.timer.digits.height * 0.5)
            this.timer.digits.context = context

            // Texture
            const texture = new THREE.Texture(canvas)
            texture.minFilter = THREE.LinearFilter
            texture.magFilter = THREE.LinearFilter
            texture.generateMipmaps = false

            this.timer.digits.texture = texture

            // Digits
            const geometry = new THREE.PlaneGeometry(this.timer.digits.ratio, 1)
            const material = new THREE.MeshBasicNodeMaterial({
                alphaMap: this.timer.digits.texture,
                alphaTest: 0.5
            })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.scale.setScalar(0.5)
            this.timer.group.add(mesh)
        }

        // Write
        this.timer.write = (text) =>
        {
            this.timer.digits.context.fillStyle = '#000000'
            this.timer.digits.context.fillRect(0, 0, this.timer.digits.width, this.timer.digits.height)
            
            this.timer.digits.context.fillStyle = '#ffffff'
            this.timer.digits.context.fillText(text, this.timer.digits.width * 0.5, this.timer.digits.height * 0.5)

            this.timer.digits.texture.needsUpdate = true
        }

        // Show
        this.timer.show = () =>
        {
            this.timer.visible = true

            this.timer.write('00:00:000')

            this.timer.group.position.copy(this.game.player.position)
            this.timer.group.position.y = 2.5
            this.timer.group.scale.setScalar(1)

            this.timer.group.visible = true
        }

        // Hide
        this.timer.hide = () =>
        {
            const value = { scale: 1 }

            gsap.to(
                value,
                {
                    scale: 0,
                    duration: 1,
                    ease: 'back.in(2)',
                    onUpdate: () =>
                    {
                        this.timer.group.scale.setScalar(value.scale)
                    },
                    // onComplete: () =>
                    // {
                    //     this.timer.group.visible = false
                    // }
                }
            )
            
            this.timer.visible = false
        }

        // Start
        this.timer.start = () =>
        {
            this.timer.running = true

            this.timer.startTime = this.game.ticker.elapsed
        }

        // End
        this.timer.end = () =>
        {
            this.timer.running = false
            this.timer.elapsedTime = this.game.ticker.elapsed - this.timer.startTime

            const formatedTime = timeToRaceString(this.timer.elapsedTime)
            this.timer.write(formatedTime)

            // End modal
            this.endModal.timeElement.textContent = formatedTime
        }

        // Update
        this.timer.update = () =>
        {
            // Group > Follow car
            const target = new THREE.Vector3()

            if(this.state === CircuitArea.STATE_PENDING)
            {
                target.x = this.timer.defaultPosition.x
                target.y = 2.5
                target.z = this.timer.defaultPosition.z
            }
            else
            {
                target.x = this.game.player.position.x - 2
                target.y = 2.5
                target.z = this.game.player.position.z + 1
            }
            
            this.timer.group.position.lerp(target, this.game.ticker.deltaScaled * 5)
            // this.timer.group.position.z = this.game.player.position2.y

            // Digits
            if(this.timer.running)
            {
                this.timer.elapsedTime = this.game.ticker.elapsed - this.timer.startTime
                this.timer.write(timeToRaceString(this.timer.elapsedTime))
            }
        }
    }

    setCheckpoints()
    {
        this.checkpoints = {}
        this.checkpoints.items = []
        this.checkpoints.count = 0
        this.checkpoints.checkRadius = 2
        this.checkpoints.target = null
        this.checkpoints.last = null
        this.checkpoints.reachedCount = 0
        this.checkpoints.timings = []

        // Create checkpoints
        const baseCheckpoints = this.references.items.get('checkpoints').sort((a, b) => a.name.localeCompare(b.name))

        let i = 0
        for(const baseCheckpoint of baseCheckpoints)
        {
            const checkpoint = {}

            baseCheckpoint.rotation.reorder('YXZ')
            baseCheckpoint.visible = false

            checkpoint.index = i
            checkpoint.position = baseCheckpoint.position.clone()
            checkpoint.rotation = baseCheckpoint.rotation.y
            checkpoint.scale = baseCheckpoint.scale.x * 0.5
            
            // Respawn position
            checkpoint.respawnPosition = baseCheckpoint.position.clone()
            const direction = new THREE.Vector2(3, 0)
            direction.rotateAround(new THREE.Vector2(), checkpoint.rotation)
            checkpoint.respawnPosition.x += direction.y
            checkpoint.respawnPosition.y = 4
            checkpoint.respawnPosition.z += direction.x

            // Center
            checkpoint.center = new THREE.Vector2(checkpoint.position.x, checkpoint.position.z)

            // Segment
            checkpoint.a = new THREE.Vector2(checkpoint.position.x - checkpoint.scale, checkpoint.position.z)
            checkpoint.b = new THREE.Vector2(checkpoint.position.x + checkpoint.scale, baseCheckpoint.position.z)

            checkpoint.a.rotateAround(checkpoint.center, - checkpoint.rotation)
            checkpoint.b.rotateAround(checkpoint.center, - checkpoint.rotation)

            // // Helpers
            // const helperA = new THREE.Mesh(
            //     new THREE.CylinderGeometry(0.1, 0.1, 2, 8, 1),
            //     new THREE.MeshBasicNodeMaterial({ color: 'yellow', wireframe: true })
            // )
            // helperA.position.x = checkpoint.a.x
            // helperA.position.z = checkpoint.a.y
            // this.game.scene.add(helperA)

            // const helperB = new THREE.Mesh(
            //     new THREE.CylinderGeometry(0.1, 0.1, 2, 8, 1),
            //     new THREE.MeshBasicNodeMaterial({ color: 'yellow', wireframe: true })
            // )
            // helperB.position.x = checkpoint.b.x
            // helperB.position.z = checkpoint.b.y
            // this.game.scene.add(helperB)

            // Set target
            checkpoint.setTarget = () =>
            {
                this.checkpoints.target = checkpoint

                // Mesh
                this.checkpoints.doorTarget.scaleUniform.value = checkpoint.scale
                this.checkpoints.doorTarget.mesh.visible = true
                this.checkpoints.doorTarget.mesh.position.copy(checkpoint.position)
                this.checkpoints.doorTarget.mesh.rotation.y = checkpoint.rotation
                this.checkpoints.doorTarget.mesh.scale.x = checkpoint.scale
            }

            // Reach
            checkpoint.reach = () =>
            {
                // Not target
                if(checkpoint !== this.checkpoints.target)
                    return

                // Confetti
                if(this.game.world.confetti)
                {
                    this.game.world.confetti.pop(new THREE.Vector3(checkpoint.a.x, 0, checkpoint.a.y))
                    this.game.world.confetti.pop(new THREE.Vector3(checkpoint.b.x, 0, checkpoint.b.y))
                }

                // Mesh
                this.checkpoints.doorReached.scaleUniform.value = checkpoint.scale
                this.checkpoints.doorReached.mesh.visible = true
                this.checkpoints.doorReached.mesh.position.copy(checkpoint.position)
                this.checkpoints.doorReached.mesh.rotation.y = checkpoint.rotation
                this.checkpoints.doorReached.mesh.scale.x = checkpoint.scale
                
                // Update reach count and last
                this.checkpoints.last = checkpoint
                this.checkpoints.reachedCount++

                // Sound
                this.sounds.checkpoint.play(this.checkpoints.reachedCount)

                // Timings
                this.checkpoints.timings.push(Math.round(this.timer.elapsedTime * 1000))

                // Final checkpoint (start line)
                if(this.checkpoints.reachedCount === this.checkpoints.count + 2)
                {
                    this.finish()
                }

                // Next checkpoint
                else
                {
                    const newTarget = this.checkpoints.items[this.checkpoints.reachedCount % (this.checkpoints.count + 1)]
                    newTarget.setTarget()
                }
                
                // No more target
                this.checkpoints.target
            }

            this.checkpoints.count = this.checkpoints.items.length

            // Save
            this.checkpoints.items.push(checkpoint)

            i++
        }

        // Checkpoint doors
        const doorIntensity = uniform(2)
        const doorOutputColor = Fn(([doorColor, doorScale]) =>
        {
            const baseUv = uv()

            const squaredUV = baseUv.toVar()
            squaredUV.y.subAssign(this.game.ticker.elapsedScaledUniform.mul(0.2))
            squaredUV.mulAssign(vec2(
                doorScale,
                1
            ).mul(2))

            const stripes = squaredUV.x.add(squaredUV.y).fract().step(0.5)

            const alpha = baseUv.y.oneMinus().mul(stripes)

            return vec4(doorColor.mul(doorIntensity), alpha)
        })

        const doorGeometry = new THREE.PlaneGeometry(2, 2)

        {
            this.checkpoints.doorTarget = {}
            this.checkpoints.doorTarget.scaleUniform = uniform(2)
            this.checkpoints.doorTarget.color = uniform(color('#32ffc1'))

            const material = new THREE.MeshBasicNodeMaterial({ transparent: true, side: THREE.DoubleSide })
            material.outputNode = doorOutputColor(this.checkpoints.doorTarget.color, this.checkpoints.doorTarget.scaleUniform)
            
            const mesh = new THREE.Mesh(doorGeometry, material)
            mesh.scale.x = 1
            mesh.castShadow = false
            mesh.receiveShadow = false
            mesh.material = material
            mesh.visible = false
            this.game.scene.add(mesh)

            this.checkpoints.doorTarget.mesh = mesh
        }

        {
            this.checkpoints.doorReached = {}
            this.checkpoints.doorReached.scaleUniform = uniform(2)
            this.checkpoints.doorReached.color = uniform(color('#cbff62'))
            
            const material = new THREE.MeshBasicNodeMaterial({ transparent: true, side: THREE.DoubleSide })
            material.outputNode = doorOutputColor(this.checkpoints.doorReached.color, this.checkpoints.doorReached.scaleUniform)
            
            const mesh = new THREE.Mesh(doorGeometry, material)
            mesh.scale.x = 1
            mesh.castShadow = false
            mesh.receiveShadow = false
            mesh.material = material
            mesh.visible = false
            this.game.scene.add(mesh)

            this.checkpoints.doorReached.mesh = mesh
        }

        // Debug
        if(this.game.debug.active)
        {
            const debugPanel = this.debugPanel.addFolder({ title: 'checkpoints' })
            this.game.debug.addThreeColorBinding(debugPanel, this.checkpoints.doorTarget.color.value, 'targetColor')
            this.game.debug.addThreeColorBinding(debugPanel, this.checkpoints.doorReached.color.value, 'reachedColor')
            
            debugPanel.addBinding(doorIntensity, 'value', { label: 'intensity', min: 0, max: 5, step: 0.01 })
        }
    }

    setResetObjects()
    {
        this.resetObjects = {}
        this.resetObjects.items = []

        const baseObjects = this.references.items.get('objects')

        for(const baseObject of baseObjects)
        {

            this.resetObjects.items.push(baseObject.userData.object)
        }

        this.resetObjects.reset = () =>
        {
            for(const object of this.resetObjects.items)
                this.game.objects.resetObject(object)
        }
    }

    setObstacles()
    {
        this.obstacles = {}
        this.obstacles.items = []
        
        const baseObstacles = this.references.items.get('obstacles')

        let i = 0
        for(const baseObstacle of baseObstacles)
        {
            const obstacle = {}
            obstacle.object = baseObstacle.userData.object
            obstacle.osciliationOffset = - i * 1
            obstacle.basePosition = obstacle.object.visual.object3D.position.clone()

            this.obstacles.items.push(obstacle)

            i++
        }
    }
 
    setRoad()
    {
        this.roadBody = this.references.items.get('road')[0].userData.object.physical.body
        this.roadBody.setEnabled(false)
    }
    
    setRails()
    {
        this.rails = {}
        
        const railsMesh = this.references.items.get('rails')[0]
        railsMesh.material = railsMesh.material.clone()
        railsMesh.material.side = THREE.DoubleSide

        this.rails.object = railsMesh.userData.object
        
        this.rails.activate = () =>
        {
            this.game.objects.enable(this.rails.object)
        }
        
        this.rails.deactivate = () =>
        {
            this.game.objects.disable(this.rails.object)
        }

        this.rails.deactivate()
    }

    setInteractivePoint()
    {
        this.interactivePoint = this.game.interactivePoints.create(
            this.references.items.get('interactivePoint')[0].position,
            t('Start race!', 'Départ course !'),
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                // Sound
                const sound = this.game.audio.groups.get('click')
                if(sound)
                    sound.play(true)

                this.restart()
            },
            () =>
            {
                this.game.inputs.interactiveButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            }
        )
    }

    setStartAnimation()
    {
        this.startAnimation = {}
        this.startAnimation.timeline = gsap.timeline({ paused: true })
        this.startAnimation.interDuration = 2
        this.startAnimation.endCallback = null

        this.startAnimation.timeline.add(() =>
        {
            this.sounds.countdown1.play()
            this.startingLights.mesh.visible = true
            this.startingLights.mesh.position.z = this.startingLights.baseZ + 0.01
        })
        this.startAnimation.timeline.add(gsap.delayedCall(this.startAnimation.interDuration, () =>
        {
            this.sounds.countdown1.play()
            this.startingLights.mesh.position.z = this.startingLights.baseZ + 0.02
        }))
        this.startAnimation.timeline.add(gsap.delayedCall(this.startAnimation.interDuration, () =>
        {
            this.sounds.countdown1.play()
            this.startingLights.mesh.position.z = this.startingLights.baseZ + 0.03
        }))
        this.startAnimation.timeline.add(gsap.delayedCall(this.startAnimation.interDuration, () =>
        {
            this.sounds.countdown2.play()
            this.startingLights.mesh.material = this.startingLights.greenMaterial

            if(typeof this.startAnimation.endCallback === 'function')
                this.startAnimation.endCallback()
        }))
        this.startAnimation.timeline.add(gsap.delayedCall(this.startAnimation.interDuration, () =>
        {
        }))

        this.startAnimation.start = (endCallback) =>
        {
            this.startAnimation.endCallback = endCallback
            this.startAnimation.timeline.seek(0)
            this.startAnimation.timeline.play()
        }
    }

    setRespawn()
    {
        this.game.inputs.addActions([
            { name: 'circuitRestart', categories: [ 'racing' ], keys: [ 'Keyboard.KeyR', 'Gamepad.select' ] },
        ])

        // Reset
        this.game.inputs.events.on('circuitRestart', (action) =>
        {
            if(action.active)
                this.restart()
        })
    }

    respawn()
    {
        if(this.state !== CircuitArea.STATE_RUNNING)
            return

        // Player > Lock
        this.game.player.state = Player.STATE_LOCKED

        // Respawn position and rotation
        const position = new THREE.Vector3()
        let rotation = 0

        if(this.checkpoints.last)
        {
            position.copy(this.checkpoints.last.respawnPosition)
            rotation = this.checkpoints.last.rotation + Math.PI * 0.5
        }
        else
        {
            position.copy(this.startPosition.position)
            rotation = this.startPosition.rotation
        }
    
        this.game.overlay.show(() =>
        {
            // Player > Unlock
            gsap.delayedCall(2, () =>
            {
                this.game.player.state = Player.STATE_DEFAULT
            })

            // Update physical vehicle
            this.game.physicalVehicle.moveTo(
                position,
                rotation
            )
            
            this.game.overlay.hide()
        })
    }

    setBounds()
    {
        this.bounds = {}
        this.bounds.threshold = 0
        this.bounds.isOut = false
    }

    setAirDancers()
    {
        const baseAirDancers = this.references.items.get('airDancers')
        const height = 5
        const colorNode = uniform(color('#d684ff'))

        const material = baseAirDancers[0].material.clone()

        const rotation = float(0).toVarying()
        const intensity = float(0).toVarying()
        
        material.positionNode = Fn(() =>
        {
            const newPosition = positionGeometry.toVar()

            const localTime = this.game.ticker.elapsedScaledUniform

            intensity.assign(
                localTime
                    .mul(0.34)
                    .sub(positionGeometry.y.div(height * 2))
                    .fract()
                    .sub(0.5)
                    .mul(2)
                    .abs()
            )

            const heightFade = positionGeometry.y.div(height)

            const rotation1 = sin(localTime.mul(0.678)).mul(0.7)
            const rotation2 = sin(localTime.mul(1.4)).mul(0.35)
            const rotation3 = sin(localTime.mul(2.4)).mul(0.2)
            rotation.assign(add(rotation1, rotation2, rotation3).mul(heightFade).mul(intensity).mul(this.game.wind.strength.remap(0, 1, 0.25, 1)))

            const rotationCenter = vec2(0, 0)
            newPosition.xy.assign(rotateUV(newPosition.xy, rotation, rotationCenter))
            
            return newPosition
        })()

        material.normalNode = Fn(() =>
        {
            const newNormalGeometry = normalGeometry.toVar()
            newNormalGeometry.xy.assign(rotateUV(newNormalGeometry.xy, rotation, vec2(0)))
            return newNormalGeometry
        })()

        // material.outputNode = Fn(() =>
        // {
        //     return vec4(vec3(intensity), 1)
        // })()

        for(const baseAirDancer of baseAirDancers)
        {
            baseAirDancer.material = material
        }

        // Debug
        if(this.game.debug.active)
        {
            const debugPanel = this.debugPanel.addFolder({ title: 'airDancers' })
            this.game.debug.addThreeColorBinding(debugPanel, colorNode.value, 'color')
            
            // debugPanel.addBinding(doorIntensity, 'value', { label: 'intensity', min: 0, max: 5, step: 0.01 })
        }
    }

    setBanners()
    {
        this.banners = this.references.items.get('banners')
    }

    setLeaderboard()
    {
        this.leaderboard = {}
        this.leaderboard.scores = []

        // 1024 plutôt que 512 : le panneau se lit depuis la voiture, et des
        // noms complets demandent des lettres plus fines que les anciens
        // pseudos de trois caractères.
        const resolution = 1024

        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')

        canvas.width = resolution
        canvas.height = resolution

        // Texture
        const textTexture = new THREE.Texture(canvas)
        textTexture.minFilter = THREE.LinearFilter
        textTexture.magFilter = THREE.LinearFilter
        textTexture.colorSpace = THREE.SRGBColorSpace
        textTexture.generateMipmaps = false

        const material = new MeshDefaultMaterial({
            colorNode: color('#463F35'),
            hasWater: false,
        })
        
        const baseOutput = material.outputNode
        
        material.outputNode = Fn(() =>
        {
            const text = texture(textTexture, uv(1))

            return vec4(
                mix(
                    baseOutput.rgb,
                    text.rgb.mul(1.3),
                    text.a
                ),
                baseOutput.a
            )
        })()

        this.leaderboard.texture = textTexture

        const mesh = this.references.items.get('leaderboard')[0]
        this.leaderboard.mesh = mesh
        mesh.material = material

        // Le tableau occupe maintenant presque toute la surface du panneau :
        // colonne des noms large (un « Jean-Baptiste DE LA TOUR » doit tenir),
        // rang à gauche, temps calé à droite.
        const rows = 10
        const left = resolution * 0.075
        const right = resolution * 0.925
        const nameLeft = resolution * 0.155
        const timeLeft = resolution * 0.66
        const interline = resolution / (rows + 1.6)
        const baseSize = interline * 0.62

        const font = (size, weight = 700) => `${weight} ${Math.round(size)}px "Nunito"`

        // Réduit la police juste ce qu'il faut pour que le nom tienne dans sa
        // colonne ; au-delà d'une certaine réduction il deviendrait illisible,
        // alors on coupe.
        const fitText = (text, maxWidth, size) =>
        {
            let current = size

            context.font = font(current)

            while(context.measureText(text).width > maxWidth && current > size * 0.6)
            {
                current -= 1
                context.font = font(current)
            }

            if(context.measureText(text).width <= maxWidth)
                return text

            let cut = text

            while(cut.length > 1 && context.measureText(`${cut}…`).width > maxWidth)
                cut = cut.slice(0, -1)

            return `${cut.trim()}…`
        }

        this.leaderboard.update = (scores = []) =>
        {
            this.leaderboard.scores = Array.isArray(scores) ? scores : []

            context.clearRect(0, 0, canvas.width, canvas.height)
            context.textBaseline = 'middle'

            if(this.leaderboard.scores.length === 0)
            {
                context.font = font(baseSize)
                context.fillStyle = '#ffffff'
                context.textAlign = 'center'
                context.fillText(t('NO TIME YET', 'AUCUN TEMPS'), resolution * 0.5, resolution * 0.5)
            }
            else
            {
                let index = 0

                for(const score of this.leaderboard.scores.slice(0, rows))
                {
                    const y = (index + 1.3) * interline

                    // Rang
                    context.fillStyle = '#ffffff'
                    context.globalAlpha = 0.5
                    context.font = font(baseSize * 0.9)
                    context.textAlign = 'left'
                    context.fillText(`${index + 1}`, left, y)
                    context.globalAlpha = 1

                    // Nom
                    context.textAlign = 'left'
                    context.fillText(
                        fitText(score.name, timeLeft - nameLeft - resolution * 0.02, baseSize),
                        nameLeft,
                        y
                    )

                    // Temps
                    context.font = font(baseSize)
                    context.textAlign = 'right'
                    context.fillText(timeToRaceString(score.timeMs / 1000), right, y)

                    index++
                }
            }

            textTexture.needsUpdate = true
        }

        this.leaderboard.update([])
    }

    setResetTime()
    {
        // L'ancien compte à rebours de remise à zéro quotidienne (serveur) est
        // devenu une étiquette fixe : les temps sont locaux et permanents
        const width = 128
        const height = 32

        // Canvas
        const font = `700 ${height / 1.75}px "Nunito"`

        const canvas = document.createElement('canvas')

        const context = canvas.getContext('2d')
        context.font = font

        canvas.width = width
        canvas.height = height

        // Texture
        const textTexture = new THREE.Texture(canvas)
        textTexture.minFilter = THREE.LinearFilter
        textTexture.magFilter = THREE.LinearFilter
        textTexture.generateMipmaps = false

        // Material
        const material = new MeshDefaultMaterial({
            colorNode: color('#463F35'),
            hasWater: false,
        })
        
        const baseOutput = material.outputNode
        
        material.outputNode = Fn(() =>
        {
            const text = texture(textTexture, uv(1)).r
            return vec4(
                mix(
                    baseOutput.rgb,
                    color('#ffffff').mul(1.3),
                    text
                ),
                baseOutput.a
            )
        })()

        const mesh = this.references.items.get('leaderboardReset')[0]
        mesh.material = material

        context.fillStyle = '#000000'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = '#ffffff'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.font = font
        context.fillText(t('BEST TIMES', 'MEILLEURS TEMPS'), canvas.width * 0.5, canvas.height * 0.5)
        textTexture.needsUpdate = true
    }

    setPodium()
    {
        this.podium = {}
        this.podium.object = this.references.items.get('podium')[0].userData.object
        this.podium.confettiPositionA = this.references.items.get('podiumConfettiA')[0].position.clone()
        this.podium.confettiPositionB = this.references.items.get('podiumConfettiB')[0].position.clone()
        const respawn = this.game.respawns.getByName('circuit')
        this.podium.viewFocusPosition = respawn.position.clone()
        this.podium.viewFocusPosition.x -= 4
        this.podium.viewFocusPosition.y = 0
        this.podium.viewFocusPosition.z -= 3
        this.podium.confettiIndex = 0
        
        this.podium.popConfetti = () =>
        {
            if(!this.game.world.confetti)
                return
            
            this.game.world.confetti.pop(this.podium.confettiIndex % 2 === 0 ? this.podium.confettiPositionA : this.podium.confettiPositionB)
            this.podium.confettiIndex++
            
            if(!this.game.view.focusPoint.isTracking)
            {
                gsap.delayedCall(2 + Math.random() * 3, () =>
                {
                    this.podium.popConfetti()
                })
            }
        }

        this.podium.show = () =>
        {
            // Object
            this.game.objects.enable(this.podium.object)

            // View
            this.game.view.focusPoint.isTracking = false
            this.game.view.focusPoint.position.copy(this.podium.viewFocusPosition)

            // Confetti
            this.podium.popConfetti()
        }
        
        this.podium.hide = () =>
        {
            // Object
            this.game.objects.disable(this.podium.object)
        }

        this.podium.hide()
    }

    setMenu()
    {
        this.menu = {}
        this.menu.instance = this.game.menu.items.get('circuit')
        this.menu.leaderboardContainerElement = this.menu.instance.contentElement.querySelector('.js-leaderboard-container')
        this.menu.leaderboardElement = this.menu.leaderboardContainerElement.querySelector('.js-leaderboard tbody')
        this.menu.noteElement = this.menu.instance.contentElement.querySelector('.js-leaderboard-note')
        this.menu.racingButtons = this.menu.instance.contentElement.querySelector('.js-racing-buttons')
        this.menu.leaderboardNeedsUpdate = false

        this.menu.instance.events.on('open', () =>
        {
            if(this.menu.leaderboardNeedsUpdate)
                this.menu.updateLeaderboard(this.menu.leaderboardNeedsUpdate)
        })

        this.menu.updateLeaderboard = (scores = null) =>
        {
            // Menu not open => Set flag
            if(!this.menu.instance.isOpen)
            {
                this.menu.leaderboardNeedsUpdate = scores ?? []
            }

            // Menu open => Update content
            else
            {
                const list = Array.isArray(scores) ? scores : []

                let html = ''
                let rank = 1
                
                for(const score of list)
                {
                    html += /* html */`
                        <tr>
                            <td>${rank}</td>
                            <td class="name">${escapeHtml(score.name)}</td>
                            <td class="time">${timeToRaceString(score.timeMs / 1000)}</td>
                        </tr>
                    `

                    rank++
                }

                this.menu.leaderboardElement.innerHTML = html

                if(list.length)
                    this.menu.leaderboardContainerElement.classList.remove('has-no-score')
                else
                    this.menu.leaderboardContainerElement.classList.add('has-no-score')

                // D'où viennent ces temps : le tableau public de tous les
                // visiteurs, ou l'appareil quand le serveur ne répond pas.
                if(this.menu.noteElement)
                {
                    const drivers = this.scores.total

                    this.menu.noteElement.innerHTML = this.scores.source !== 'server'
                        ? t(
                            'Board unreachable — showing the times saved on this device.',
                            'Tableau injoignable — voici les temps gardés sur cet appareil.'
                        )
                        : drivers > 1
                            ? t(
                                `Public board — ${drivers} drivers, the best lap of each one.`,
                                `Tableau public — ${drivers} pilotes, le meilleur tour de chacun.`
                            )
                            : t(
                                'Public board: the best lap of every visitor. Finish a race to add your name.',
                                'Tableau public : le meilleur tour de chaque visiteur. Termine une course pour y inscrire ton nom.'
                            )
                }

                this.menu.leaderboardNeedsUpdate = false
            }
        }

        // Restart button
        const restartElement = this.menu.instance.contentElement.querySelector('.js-button-restart')
        restartElement.addEventListener('click', (event) =>
        {
            event.preventDefault()

            this.restart()
            this.game.menu.close()
        })

        // End button
        const endElement = this.menu.instance.contentElement.querySelector('.js-button-end')
        endElement.addEventListener('click', (event) =>
        {
            event.preventDefault()

            if(this.state === CircuitArea.STATE_RUNNING || this.state === CircuitArea.STATE_STARTING)
                this.finish(true)
            
            this.game.menu.close()
        })

        // Controls button
        const controlsElement = this.menu.instance.contentElement.querySelector('.js-button-controls')
        controlsElement.addEventListener('click', (event) =>
        {
            event.preventDefault()
            
            this.game.menu.open('controls')
        })

    }

    setEndModal()
    {
        this.endModal = {}
        this.endModal.instance = this.game.modals.items.get('circuit-end')
        this.endModal.timeElement = this.endModal.instance.element.querySelector('.js-time')
        this.endModal.feedbackElement = this.endModal.instance.element.querySelector('.js-feedback')
        this.endModal.pending = null
        this.endModal.busy = false
        
        // Restart button
        const restartElement = this.endModal.instance.element.querySelector('.js-button-restart')
        restartElement.addEventListener('click', (event) =>
        {
            event.preventDefault()

            this.restart()
            this.game.modals.close()
        })

        this.menu.inputGroup = this.endModal.instance.element.querySelector('.js-input-group')
        this.menu.nameInput = this.menu.inputGroup.querySelector('.js-input-name')
        this.menu.submitButton = this.menu.inputGroup.querySelector('.js-submit')

        // Les lettres, l'espace, le trait d'union et l'apostrophe suffisent à
        // écrire un nom ; le serveur applique la même règle de son côté.
        const sanatize = (text = '') => text
            .replace(/[^\p{L}\p{M}' .-]/gu, '')
            .replace(/\s{2,}/g, ' ')
            .slice(0, 40)

        // Un nom, écrit comme le visiteur l'entend : prénom seul, prénom et
        // nom, nom d'abord. Deux lettres suffisent à en faire un.
        const isComplete = () =>
            (sanatize(this.menu.nameInput.value).trim().match(/\p{L}/gu) ?? []).length >= 2

        const updateGroup = () =>
        {
            if(isComplete())
                this.menu.inputGroup.classList.add('is-valide')
            else
                this.menu.inputGroup.classList.remove('is-valide')
        }

        const feedback = (message, state = '') =>
        {
            this.endModal.feedbackElement.textContent = message
            this.endModal.feedbackElement.className = `js-feedback feedback${state ? ` ${state}` : ''}`
        }

        // Messages d'erreur du serveur, traduits (voir api/_lib/circuit.js).
        const errorMessage = (error) =>
        {
            switch(error)
            {
                case 'name_length':
                case 'name_characters':
                    return t('Please enter a real name.', 'Indique un vrai nom.')
                case 'name_rejected':
                    return t('This name will not go on a public board.', 'Ce nom n’ira pas sur un tableau public.')
                case 'already_submitted':
                    return t('This race has already been saved.', 'Cette course a déjà été enregistrée.')
                case 'too_many_submits':
                    return t('Too many attempts, try again later.', 'Trop de tentatives, réessaie plus tard.')
                case 'implausible_time':
                case 'clock_mismatch':
                case 'splits_mismatch':
                case 'invalid_splits':
                case 'bad_signature':
                case 'invalid_token':
                case 'run_expired':
                case 'run_mismatch':
                    return t('This time could not be verified.', 'Ce temps n’a pas pu être vérifié.')
                default:
                    return t('Time saved on this device only.', 'Temps gardé sur cet appareil seulement.')
            }
        }

        // « 3e sur 27 » plutôt que « 3e » : le rang seul ne dit rien du monde
        // qu'on vient de battre.
        const ordinal = (rank) =>
        {
            const tens = rank % 100
            const units = rank % 10
            const suffix = units === 1 && tens !== 11 ? 'st'
                : units === 2 && tens !== 12 ? 'nd'
                : units === 3 && tens !== 13 ? 'rd'
                : 'th'

            return t(`${rank}${suffix}`, `${rank}${rank === 1 ? 'er' : 'e'}`)
        }

        const resultMessage = (result, timeMs) =>
        {
            const { rank, total } = result

            if(!rank)
                return result.improved
                    ? t('Saved on the public board.', 'Enregistré sur le tableau public.')
                    : t('Your best lap stays on the board.', 'Ton meilleur tour reste au tableau.')

            const place = total > 1
                ? t(`${ordinal(rank)} of ${total}`, `${ordinal(rank)} sur ${total}`)
                : ordinal(rank)

            const head = result.improved
                ? t(`Saved — ${place}.`, `Enregistré — ${place}.`)
                : t(`Your best lap stays on the board — ${place}.`, `Ton meilleur tour reste au tableau — ${place}.`)

            // Hors des lignes affichées : dire combien il manque, c'est la
            // seule raison de remonter en voiture.
            const visible = result.scores?.length ?? 0

            if(result.improved && visible > 0 && rank > visible && typeof result.lastVisibleMs === 'number')
            {
                const gap = (timeMs - result.lastVisibleMs) / 1000

                if(gap > 0)
                    return `${head} ${t(
                        `${gap.toFixed(1)}s faster to reach the board.`,
                        `${gap.toFixed(1).replace('.', ',')} s de moins pour entrer dans le tableau.`
                    )}`
            }

            return head
        }

        const submit = async () =>
        {
            if(this.endModal.busy || !this.endModal.pending || !isComplete())
                return

            const name = sanatize(this.menu.nameInput.value).trim()
            const attemptMs = this.endModal.pending.timeMs

            this.endModal.busy = true
            this.menu.inputGroup.classList.add('is-busy')
            feedback(t('Saving…', 'Enregistrement…'))

            const result = await this.scores.submit({
                name,
                timeMs: this.endModal.pending.timeMs,
                splits: this.endModal.pending.splits,
            })

            this.endModal.busy = false
            this.menu.inputGroup.classList.remove('is-busy')

            this.leaderboard.update(result.scores)
            this.menu.updateLeaderboard(result.scores)

            if(result.ok)
            {
                this.endModal.pending = null
                this.menu.inputGroup.classList.add('is-done')

                feedback(resultMessage(result, attemptMs), 'is-success')

                // Achievement
                this.game.achievements.setProgress('circuitLeaderboard', 1)
            }
            else
            {
                feedback(errorMessage(result.error), 'is-error')

                // Un temps hors ligne reste sauvegardé sur l'appareil : pas la
                // peine de laisser le joueur réessayer indéfiniment.
                if(result.offline)
                {
                    this.endModal.pending = null
                    this.game.achievements.setProgress('circuitLeaderboard', 1)
                }
            }
        }

        this.menu.nameInput.addEventListener('input', () =>
        {
            const cleaned = sanatize(this.menu.nameInput.value)

            if(cleaned !== this.menu.nameInput.value)
                this.menu.nameInput.value = cleaned

            updateGroup()
        })

        this.menu.inputGroup.addEventListener('submit', (event) =>
        {
            event.preventDefault()

            submit()
        })

        // Prépare la modale pour la course qui vient de finir : le temps, les
        // intermédiaires qui l'accompagnent, et le nom déjà donné ici.
        this.endModal.prepare = (timeMs, splits) =>
        {
            this.endModal.pending = { timeMs, splits }

            // Le chrono a déjà écrit ce temps à l'arrêt ; on le réaffirme ici
            // pour que l'affichage et ce qui part au serveur soient la même
            // valeur, à la milliseconde.
            this.endModal.timeElement.textContent = timeToRaceString(timeMs / 1000)
            this.endModal.busy = false
            this.menu.inputGroup.classList.remove('is-done', 'is-busy')

            this.menu.nameInput.value = this.scores.savedName()

            updateGroup()

            feedback(this.scores.online === false
                ? t('Board unreachable — your time stays on this device.', 'Tableau injoignable — ton temps reste sur cet appareil.')
                : '')
        }
    }

    restart()
    {
        if(this.state === CircuitArea.STATE_STARTING)
            return

        // Jeton de course : demandé au départ, il est la seule façon de
        // publier le temps à l'arrivée (voir CircuitScores).
        this.scores.start()

        // Area frustum
        this.frustum.alwaysVisible = true

        // Timer
        this.timer.end()
            
        // State
        this.state = CircuitArea.STATE_STARTING

        // Interactive point
        this.interactivePoint.hide()

        // Player > Lock
        this.game.player.state = Player.STATE_LOCKED

        // Inputs filters
        this.game.inputs.filters.clear()
        this.game.inputs.filters.add('racing')

        // Starting timeline
        this.startAnimation.timeline.pause()

        // Overlay > Show
        this.game.overlay.show(() =>
        {
            // Menu buttons
            this.menu.racingButtons.classList.add('is-active')

            // Update physical vehicle
            this.game.physicalVehicle.moveTo(
                this.startPosition.position,
                this.startPosition.rotation
            )

            // Deactivate terrain physics
            if(this.game.world.floor)
                this.game.world.floor.physical.body.setEnabled(false)
            
            // Activate road physics (better collision)
            this.roadBody.setEnabled(true)

            // Starting lights
            this.startingLights.reset()

            // Checkpoints
            this.checkpoints.doorReached.mesh.visible = false
            this.checkpoints.doorTarget.mesh.visible = false

            this.checkpoints.items[0].setTarget()

            this.checkpoints.reachedCount = 0
            this.checkpoints.last = null

            this.checkpoints.timings = []

            // Objects
            this.resetObjects.reset()

            // Crates (all crates in the world?)
            this.game.world.explosiveCrates.reset()

            // Weather
            this.game.weather.override.start(
                {
                    humidity: 0,
                    electricField: 0,
                    clouds: 0,
                    wind: 0
                },
                0
            )
    
            // Day cycles
            this.game.dayCycles.override.start(
                {
                    progress: 0.85,
                    fogNearRatio: 0.65,
                    fogFarRatio: 1.25
                },
                0
            )

            // Timer
            this.timer.show()

            // Rails
            this.rails.activate()

            // Podium => Hide
            this.podium.hide()

            // Overlay > Hide
            this.game.overlay.hide(() =>
            {
                // State
                this.state = CircuitArea.STATE_RUNNING

                // Start animation
                this.startAnimation.start(() =>
                {
                    // Player > Unlock
                    this.game.player.state = Player.STATE_DEFAULT

                    this.timer.start()
                })

            })
        })
    }

    setData()
    {
        // Les temps de l'appareil s'affichent tout de suite (le panneau ne
        // reste jamais vide), puis le tableau public les remplace dès qu'il
        // répond.
        const render = (scores) =>
        {
            this.leaderboard.update(scores)
            this.menu.updateLeaderboard(scores)
        }

        render(this.scores.localScores())

        this.scores.fetchBoard().then(render).catch(() => {})
    }

    setAchievement()
    {
        this.events.on('boundingIn', () =>
        {
            this.game.achievements.setProgress('areas', 'circuit')
        })
    }

    finish(forced = false)
    {
        // Not running
        if(this.state !== CircuitArea.STATE_RUNNING)
            return
            
        // State
        this.state = CircuitArea.STATE_ENDING
        
        // Timer
        this.timer.end()
        if(forced)
            this.timer.hide()

        // Checkpoints
        this.checkpoints.target = null
        this.checkpoints.doorTarget.mesh.visible = false

        // Sound
        if(!forced)
        {
            this.sounds.finish.play()
        }

        gsap.delayedCall(forced ? 1 : 4, () =>
        {
            // Overlay > Show
            this.game.overlay.show(() =>
            {
                // State
                this.state = CircuitArea.STATE_PENDING

                // Area frustum
                this.frustum.alwaysVisible = false

                // Menu buttons
                this.menu.racingButtons.classList.remove('is-active')

                // Interactive point
                this.interactivePoint.show()

                // Inputs filters
                this.game.inputs.filters.clear()
                this.game.inputs.filters.add('wandering')
                
                // Update physical vehicle
                const respawn = this.game.respawns.getByName('circuit')
                this.game.physicalVehicle.moveTo(respawn.position, respawn.rotation)

                // Activate terrain physics
                if(this.game.world.floor)
                    this.game.world.floor.physical.body.setEnabled(true)
                
                // Deactivate road physics
                this.roadBody.setEnabled(false)
        
                // Weather and day cycles
                this.game.weather.override.end(0)
                this.game.dayCycles.override.end(0)

                // Checkpoints
                this.checkpoints.doorReached.mesh.visible = false
                this.checkpoints.doorTarget.mesh.visible = false

                // Starting lights
                this.startingLights.reset()

                // Rails
                this.rails.deactivate()
                
                // Crates (all crates in the world?)
                this.game.world.explosiveCrates.reset()

                // Podium => Show
                if(!forced)
                    this.podium.show()

                // Achievement
                if(!forced)
                {
                    this.game.achievements.setProgress('circuitFinish', 1)

                    if(this.timer.elapsedTime < 30)
                        this.game.achievements.setProgress('circuitFinishFast', 1)
                }

                // Sound
                if(!forced)
                {
                    gsap.delayedCall(2, () =>
                    {
                        this.sounds.applause.play()
                    })
                }

                // Circuit en modal (enregistrement local du temps)
                if(!forced)
                {
                    gsap.delayedCall(1, () =>
                    {
                        // Tout le monde peut inscrire son nom : le tableau
                        // garde un meilleur temps par personne, pas seulement
                        // les dix premiers.
                        this.endModal.prepare(
                            Math.round(this.timer.elapsedTime * 1000),
                            [ ...this.checkpoints.timings ]
                        )

                        this.game.modals.open('circuit-end')
                    })
                }

                // Overlay > Hide
                this.game.overlay.hide(() =>
                {
                    // State
                    this.state = CircuitArea.STATE_PENDING
                })
            })
        })
    }

    update()
    {
        if(this.state === CircuitArea.STATE_RUNNING)
        {
            // Checkpoints
            for(const checkpoint of this.checkpoints.items)
            {
                const intersections = segmentCircleIntersection(
                    checkpoint.a.x,
                    checkpoint.a.y,
                    checkpoint.b.x,
                    checkpoint.b.y,
                    this.game.player.position2.x,
                    this.game.player.position2.y,
                    this.checkpoints.checkRadius
                )

                if(intersections.length)
                    checkpoint.reach()
            }

            // Obstacles
            for(const obstacle of this.obstacles.items)
            {
                const newPosition = obstacle.basePosition.clone()
                const osciliation = Math.sin(this.timer.elapsedTime * 1.25 + obstacle.osciliationOffset) * 5
                newPosition.z += osciliation
                
                obstacle.object.physical.body.setNextKinematicTranslation(newPosition)
                obstacle.object.needsUpdate = true
            }

            // If out of bounds
            if(this.game.player.position.y < this.bounds.threshold)
            {
                if(!this.bounds.isOut)
                {
                    this.bounds.isOut = true
                    this.respawn()
                }
            }
            else
            {
                this.bounds.isOut = false
            }
        }

        // Banners
        let i = 0
        for(const banner of this.banners)
        {
            const time = this.game.wind.localTime.value * 10 + i * 0.5
            const rotation = Math.sin(time) + Math.sin(time * 2.34) * 0.5 + Math.sin(time * 3.45) * 0.25
            banner.rotation.y = 0.5 + rotation * 0.5

            i++
        }

        // Timer
        this.timer.update()
    }
}