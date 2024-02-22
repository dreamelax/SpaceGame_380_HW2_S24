import AI from "../../Wolfie2D/DataTypes/Interfaces/AI";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Debug from "../../Wolfie2D/Debug/Debug";
import Emitter from "../../Wolfie2D/Events/Emitter";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import Receiver from "../../Wolfie2D/Events/Receiver";
import Input from "../../Wolfie2D/Input/Input";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import MathUtils from "../../Wolfie2D/Utils/MathUtils";
import { Homework2Event } from "../HW2_Enums";

export default class SpaceshipPlayerController implements AI {
	// We want to be able to control our owner, so keep track of them
	private owner: AnimatedSprite;

	// The direction the spaceship is moving
	private direction: Vec2;
	private MIN_SPEED: number = 0;
	private MAX_SPEED: number = 300;
	private speed: number;
	private ACCELERATION: number = 4;
	private rotationSpeed: number;

	private isDead: boolean = false;

	// A receiver and emitter to hook into the event queue
	private receiver: Receiver;
	private emitter: Emitter;

	// HOMEWORK 2 - TODO
	/**
	 * This method initializes all variables inside of this AI class, and sets
	 * up anything we need it do.
	 * 
	 * You should subscribe to the correct event for player damage here using the Receiver.
	 * The AI will react to the event in handleEvent() - you just need to make sure
	 * it is subscribed to them.
	 * 
	 * @param owner The owner of this AI - i.e. the player
	 * @param options The list of options for ai initialization
	 */
	initializeAI(owner: AnimatedSprite, options: Record<string, any>): void {
		this.owner = owner;

		// Start facing up
		this.direction = new Vec2(0, 1);
		this.speed = 0;
		this.rotationSpeed = 2;

		this.receiver = new Receiver();
		this.emitter = new Emitter();

		this.receiver.subscribe(Homework2Event.PLAYER_DAMAGE);
		this.receiver.subscribe(Homework2Event.PLAYER_DEAD);
		this.receiver.subscribe(Homework2Event.PLAYER_DIE);
		this.receiver.subscribe(Homework2Event.PLAYER_I_FRAMES_END);
	}

	activate(options: Record<string, any>){};

	handleEvent(event: GameEvent): void {
		// We need to handle animations when we get hurt
		if(event.type === Homework2Event.PLAYER_DAMAGE){
			console.log("DID HE DIE??"+event.data.get("shield"));
			this.owner.animation.play("shield", false, Homework2Event.PLAYER_I_FRAMES_END);
			this.speed = (this.speed)/2; // i wanted speed to be reduced by 2 when made
		}
		if(event.type === Homework2Event.PLAYER_DEAD){
			//this.owner.animation.queue("shield", false, Homework2Event.PLAYER_I_FRAMES_END);
			this.owner.animation.playIfNotAlready("explode", false, Homework2Event.PLAYER_DIE);
			this.owner.animation.queue("dead", true);
			this.isDead = true;
		}
	}

	update(deltaT: number): void {
		if(this.isDead) return;
		
		while(this.receiver.hasNextEvent()){
			this.handleEvent(this.receiver.getNextEvent());
		}

		// We need to handle player input
		let forwardAxis = (Input.isPressed('forward') ? 1 : 0) + (Input.isPressed('backward') ? -1 : 0);
		let turnDirection = (Input.isPressed('turn_ccw') ? -1 : 0) + (Input.isPressed('turn_cw') ? 1 : 0);

		// Space controls - speed stays the same if nothing happens
		// Forward to speed up, backward to slow down
		this.speed += this.ACCELERATION * forwardAxis;
		this.speed = MathUtils.clamp(this.speed, this.MIN_SPEED, this.MAX_SPEED);

		// Rotate the player
		this.direction.rotateCCW(turnDirection * this.rotationSpeed * deltaT);

		// Update the visual direction of the player
		this.owner.rotation = -(Math.atan2(this.direction.y, this.direction.x) - Math.PI/2);
		
		// Move the player
		this.owner.position.add(this.direction.scaled(-this.speed * deltaT));

		Debug.log("player_pos", "Player Position: " + this.owner.position.toString());
	
		// If the player clicked, we need to spawn in a fleet member
		if(Input.isMouseJustPressed()){
			this.emitter.fireEvent(Homework2Event.SPAWN_FLEET, {position: Input.getGlobalMousePosition()});
		}

		// Animations
		if(!this.owner.animation.isPlaying("shield") && !this.owner.animation.isPlaying("explode")){
			if(this.speed > 0){
				this.owner.animation.playIfNotAlready("boost");
			} else {
				this.owner.animation.playIfNotAlready("idle");
			}
		}
	}
} 