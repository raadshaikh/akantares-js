(() => {
	
	//mod function
	function abs(x){
		return x>0 ? x : -1*x;
	}
	
	//utility function to force a number to within an allowed interval
	function clamp(number, min, max) {
		return Math.max(min, Math.min(number, max));
	}
	
	//pythagoras
	function dist2(dx, dy, dz=0){
		return (dx**2 + dy**2 + dz**2)**0.5;
	}
	function dist4(x1, x2, y1, y2){
		return ((x1-x2)**2 + (y1-y2)**2)**0.5;
	}
	
	//dot product
	function dot(v1x, v1y, v2x, v2y){
		return v1x*v2x + v1y*v2y;
	}
	
	//angle between two vectors
	function angle(v1x, v1y, v2x, v2y){
		//return Math.acos(dot(v1x,v1y,v2x,v2y)/(dist2(v1x,v1y)*dist2(v2x,v2y)));
		return Math.atan2(v2y,v2x) - Math.atan2(v1y,v1x);
	}
	
    class Game {
        constructor() {
			this.gameState = 'loading'; //loading, startscreen, playing, escmenu, gameover
			this.gameSubState = 'null'; //if gameState == 'playing', this can be 'ready', 'countdown', 'flying', or 'collided'. otherwise it is 'null'.
			this.level = 0;
			this.help = false;
			this.previousGameState = 'startscreen';
			this.keyHasBeenPressed = {horizontal:0, vertical:0};
			
			this.score = [1,2];
			
			this.justStartedPlaying = true; //for the 'are you ready' sound effect
			
			this.dt = 0.05;
			this.G = 3000;
			this.initCatapultSpeed = 12;
			this.respiteFrames = 90; //# of frames at beginning when player gravity is disabled
			
			this.playerAngle = 360;
			this.playerPos = {x:40, y:window.height/2};
			this.playerCatapultPos = {x:this.playerPos.x+10*Math.cos(this.playerAngle*Math.PI/180), y:this.playerPos.y+10*Math.sin(this.playerAngle*Math.PI/180)};
			this.playerCatapultVel = {x:0, y:0};
			this.playerCatapultAcc = {x:0, y:0};
			this.playerTrail = [];
			this.enemyAngle = 360;
			this.enemyPos = {x:256, y:window.height/2};
			this.enemyCatapultPos = {x:this.enemyPos.x+10*Math.cos(this.enemyAngle*Math.PI/180), y:this.enemyPos.y+10*Math.sin(this.enemyAngle*Math.PI/180)};
			this.enemyCatapultVel = {x:0, y:0};
			this.enemyCatapultAcc = {x:0, y:0};
			this.enemyTrail = [];
			this.planets = []; //planets, not planetsPos, becase i'll also encode size in this (m=0 or 1)
			this.numPlanets = 1+Math.floor(3*Math.random());
			for(let i=0; i<this.numPlanets; i++){
				this.planets[i] = {x:60+160*Math.random(), y:12+200*Math.random(), m:(Math.random()<0.3)};
			}
			
        
			this.debugInvulnerability = false;
		}
		
		fire(){
			console.log('fire');
			ui.frameCount = 0;
			
			this.playerCatapultVel.x = this.initCatapultSpeed*Math.cos(this.playerAngle*Math.PI/180);
			this.playerCatapultPos.x = this.playerPos.x + 10*Math.cos(this.playerAngle*Math.PI/180);
			this.playerCatapultVel.y = this.initCatapultSpeed*Math.sin(this.playerAngle*Math.PI/180);
			this.playerCatapultPos.y = this.playerPos.y + 10*Math.sin(this.playerAngle*Math.PI/180);
							
			this.gameSubState = 'flying';
			document.getElementById('fireRange').style.visibility = 'hidden';
			document.getElementById('fireButton').disabled = true;			
		}
		
		resetStuff(){ //make a separate resetGame and resetForNextLevel and reset after shot?
			this.score = 0;
			this.playerPos = {x:window.width/2, y:window.height-20-16/2};
			this.playerCurPos = {x:window.width/2, y:window.height-20-16/2};
			this.playerVel = {x:0, y:0};
			this.playerAcc = {x:0, y:0};
			for(let i=0; i<7; i++){
				this.playerSegPos[i] = {x:window.width/2, y:window.height-20-16/2};
				this.playerSegVel[i] = {x:0, y:0};
				this.playerSegAcc[i] = {x:0, y:0};
			}
			this.sparklePos = {x:window.width/2, y:window.height-20-16/2};
			this.sparklePosPrev = {x:window.width/2, y:window.height-20-16/2};
			this.sparkleVel = {x:0, y:0};
			this.sparkleAcc = {x:0, y:0};
			this.lemonPos = {x:72+48/2, y:16+48/2};
			this.lemonVel = {x:10, y:0};
			this.paw0Pos = {x:146, y:211};
			this.paw1Pos = {x:186, y:216};
			ui.frameCount = 0;
			this.lastCollision = -100;
			this.lemonIdleTime = 0;
		}
		
        update() {
			
			this.keyHandling(window.keysBeingPressed);
			
			switch(this.gameState){
				
				case 'loading':
					break;
				
				case 'startscreen':
					this.justStartedPlaying = true;
					break;
				
				case 'playing':
					// if(this.justStartedPlaying){
						// ui.se[6].play();
						// this.justStartedPlaying = false;
					// }
										
					switch(this.gameSubState){
						
						case 'ready':
							break;
							
						case 'countdown':
							break;
							
						case 'flying':
						
							//bullet ('catapult') movement
					
							this.playerCatapultAcc.x = 0;							
							//respite frames disable the effect of gravity of the player for a bit at the beginning so that the catapult doesn't just get stuck orbiting the player
							if(ui.frameCount>this.respiteFrames) {this.playerCatapultAcc.x -= this.G*(this.playerCatapultPos.x-this.playerPos.x)*dist2(this.playerCatapultPos.x-this.playerPos.x, this.playerCatapultPos.y-this.playerPos.y, 10)**-3;} //the dz=10 is to make sure it's always some distance away from the planet, to avoid singularities
							this.playerCatapultAcc.x -= this.G*(this.playerCatapultPos.x-this.enemyPos.x)*dist2(this.playerCatapultPos.x-this.enemyPos.x, this.playerCatapultPos.y-this.enemyPos.y, 10)**-3;
							for(let i=0; i<this.numPlanets; i++){
								this.playerCatapultAcc.x -= this.G*(1+this.planets[i].m)*(this.playerCatapultPos.x-this.planets[i].x)*dist2(this.playerCatapultPos.x-this.planets[i].x, this.playerCatapultPos.y-this.planets[i].y, 10+4*this.planets[i].m)**-3;
							}
							this.playerCatapultVel.x += this.dt*this.playerCatapultAcc.x;
							this.playerCatapultPos.x += this.dt*this.playerCatapultVel.x;
							
							this.playerCatapultAcc.y = 0;							
							if(ui.frameCount>this.respiteFrames) {this.playerCatapultAcc.y -= this.G*(this.playerCatapultPos.y-this.playerPos.y)*dist2(this.playerCatapultPos.x-this.playerPos.x, this.playerCatapultPos.y-this.playerPos.y, 10)**-3;}
							this.playerCatapultAcc.y -= this.G*(this.playerCatapultPos.y-this.enemyPos.y)*dist2(this.playerCatapultPos.x-this.enemyPos.x, this.playerCatapultPos.y-this.enemyPos.y, 10)**-3;
							for(let i=0; i<this.numPlanets; i++){
								this.playerCatapultAcc.y -= this.G*(1+this.planets[i].m)*(this.playerCatapultPos.y-this.planets[i].y)*dist2(this.playerCatapultPos.x-this.planets[i].x, this.playerCatapultPos.y-this.planets[i].y, 10+4*this.planets[i].m)**-3;
							}
							this.playerCatapultVel.y += this.dt*this.playerCatapultAcc.y;
							this.playerCatapultPos.y += this.dt*this.playerCatapultVel.y;
							
							if(ui.frameCount%10 == 0){
								this.playerTrail.push({x:this.playerCatapultPos.x, y:this.playerCatapultPos.y});
							}
					
							break;
							
						case 'collided':
							break;
					}
					
					break;
					
					//pawprint movement
					//still not sure of the mechanics of this
					if(ui.frameCount>this.respiteFrames){//they're inactive for a bit at the beginning
						if(ui.frameCount % this.pawPeriod == 0){
							switch((ui.frameCount/this.pawPeriod)%4){
								case 0:
									this.paw0Pos = {x:window.width*2, y:window.height*2}; //move it off-screen so it 'disappears'
									ui.se[2].play();
									break;
								case 1:
									this.paw0Pos.x = this.sparklePos.x;
									this.paw0Pos.y = this.sparklePos.y;
									break;
								case 2:
									this.sparklePosPrev.x = this.sparklePos.x;
									this.sparklePosPrev.y = this.sparklePos.y;
									this.paw1Pos = {x:window.width*2, y:window.height*2};
									ui.se[2].play();
									break;
								case 3:
									this.paw1Pos.x = this.sparklePosPrev.x;
									this.paw1Pos.y = this.sparklePosPrev.y;
									break;
								default:
									break;
							}
						}
					}
					
					
					//collisions
					
					//playerTail-pawPrint
					if(!this.debugInvulnerability && ui.frameCount>this.respiteFrames){
						if((abs(this.playerSegPos[6].x-this.paw0Pos.x)<28/2 && abs(this.playerSegPos[6].y-this.paw0Pos.y)<28/2) || (abs(this.playerSegPos[6].x-this.paw1Pos.x)<28/2 && abs(this.playerSegPos[6].y-this.paw1Pos.y)<28/2)){
							ui.se[5].play();
							if(this.score > this.highscore){this.highscore = this.score;}
							this.gameState = 'gameover';
							this.previousGameState = 'gameover';
						}
					}
					
					//player-wall
					// if((this.playerCurPos.x < 20) || (this.playerCurPos.x > window.width-20)){
						// this.playerCurPos.x = clamp(this.playerCurPos.x, 20, window.width-20);
					// }
					// if((this.playerCurPos.y < 20) || (this.playerCurPos.y > window.height-20)){
						// this.playerCurPos.y = clamp(this.playerCurPos.y, 20, window.height-20);
					// }
					if((this.playerPos.x < 20+16/2 && this.playerVel.x<0) || (this.playerPos.x > window.width-20-16/2 && this.playerVel.x>0)){
						this.lastCollision = structuredClone(ui.frameCount);
						this.playerVel.x *= -1*this.corPW;
						this.playerCurVel.x = this.playerVel.x;
						this.playerPos.x = clamp(this.playerPos.x, 20+16/2, window.width-20-16/2);
						this.playerCurPos.x = clamp(this.playerPos.x, 20+16/2, window.width-20-16/2);
						ui.se[3].play();
					}
					if((this.playerPos.y < 20+16/2 && this.playerVel.y<0) || (this.playerPos.y > window.height-20-16/2 && this.playerVel.y>0)){
						this.lastCollision = structuredClone(ui.frameCount);
						this.playerVel.y *= -1*this.corPW;
						this.playerCurVel.y = this.playerVel.y;
						this.playerPos.y = clamp(this.playerPos.y, 20+16/2, window.height-20-16/2);
						this.playerCurPos.y = clamp(this.playerPos.y, 20+16/2, window.height-20-16/2);
						ui.se[3].play();
					}
					
					//lemon-wall
					if((this.lemonPos.y < 20+48/2 && this.lemonVel.y<0) || (this.lemonPos.y > window.height-20-48/2 && this.lemonVel.y>0)){
						this.lemonVel.y *= -1*this.corLW;
						this.lemonVel.y += 0.1*(this.lemonVel.y ? this.lemonVel.y < 0 ? -1 : 1 : 0) //same as above, so the lemon never really stops
						this.lemonPos.y = clamp(this.lemonPos.y, 20+48/2, window.height-20-48/2);
						ui.se[4].play();
					}
					if((this.lemonPos.x < 20+48/2 && this.lemonVel.x<0) || (this.lemonPos.x > window.width-20-48/2 && this.lemonVel.x>0)){
						this.lemonVel.x *= -1*this.corLW;
						this.lemonPos.x = clamp(this.lemonPos.x, 20+48/2, window.width-20-48/2);
						ui.se[4].play();
					}
					
					//player-lemon
					let dx = this.lemonPos.x-this.playerPos.x;
					let dy = this.lemonPos.y-this.playerPos.y;
					const r = dist2(dx, dy);
					const dvx = this.playerVel.x-this.lemonVel.x;
					const dvy = this.playerVel.y-this.lemonVel.y;
					
					if((r<(48/2 + 16/2)) && (dot(dx, dy, dvx, dvy)>0)){
						this.lastCollision = structuredClone(ui.frameCount);
						
						dx /= r;
						dy /= r; //now {dx, dy} = normalised displacement vector
						const k1 = (this.playerMass - this.lemonMass)/(this.playerMass + this.lemonMass);
						const k2 = 2*this.playerMass/(this.playerMass + this.lemonMass);
						const k3 = 2*this.lemonMass/(this.playerMass + this.lemonMass);
						const u1 = structuredClone(this.playerVel);
						const u2 = structuredClone(this.lemonVel);
						
						const u1h_x = dot(u1.x, u1.y, dx, dy)*dx; //h for head-on
						const u1h_y = dot(u1.x, u1.y, dx, dy)*dy;
						const u2h_x = dot(u2.x, u2.y, dx, dy)*dx;
						const u2h_y = dot(u2.x, u2.y, dx, dy)*dy;
						
						const v1h_x = this.corLP*(k1*u1h_x + k3*u2h_x);
						const v1h_y = this.corLP*(k1*u1h_y + k3*u2h_y);
						const v2h_x = this.corLP*(k2*u1h_x - k1*u2h_x);
						const v2h_y = this.corLP*(k2*u1h_y - k1*u2h_y);
						
						const v1g_x = u1.x-u1h_x; //g for glancing
						const v1g_y = u1.y-u1h_y;
						const v2g_x = u2.x-u2h_x;
						const v2g_y = u2.y-u2h_y;
						
						this.playerVel.x = (v1h_x + v1g_x);
						this.playerVel.y = (v1h_y + v1g_y);
						this.playerCurVel.x = (v1h_x + v1g_x);
						this.playerCurVel.y = (v1h_y + v1g_y);
						this.lemonVel.x = v2h_x + v2g_x;
						this.lemonVel.y = v2h_y + v2g_y;
						this.playerPos.x = this.lemonPos.x-(50/2+16/2)*dx;
						this.playerPos.y = this.lemonPos.y-(50/2+16/2)*dy;
						this.playerCurPos.x = this.lemonPos.x-(50/2+18/2)*dx;
						this.playerCurPos.y = this.lemonPos.y-(50/2+18/2)*dy;
						this.score += 1;
						ui.se[0].play();
					}
					
					
					break;
				
				case 'gameover':
					this.justStartedPlaying = true;
					break;
				
				case 'escmenu':
					break;
			}
			if (this.onUpdate) this.onUpdate(this);
			
		}
		
		keyHandling(ekeys) {
			if(ekeys['z']){
				window.scale = window.scale==1?2:1;
				gameCanvas.width = window.scale*window.width;
				gameCanvas.height = window.scale*window.height;
				ui.ctx.imageSmoothingEnabled = false;
				ui.ctx.scale(window.scale, window.scale);
				if('ontouchstart' in window){
					touchCanvas.width = window.scale*window.width;
					touchCanvas.height = window.scale*window.height;
					ui.ctx2.imageSmoothingEnabled = false;
					ui.ctx2.scale(window.scale, window.scale);
				}
				ekeys['z'] = false;
			}
			if(ekeys['Escape']){
				if(this.gameState != 'escmenu'){
					window.audioContext.suspend();
					this.gameState = 'escmenu';
					ekeys['Escape'] = false;
				}
			}
			switch(this.gameState){
				case 'loading':
					if(ekeys[' ']){
						ekeys[' ']=false;
						this.gameState = 'playing'; //!! change back to startscreen or something later
						this.gameSubState = 'ready';
					}
					break;
				case 'startscreen':
					if(ekeys[' ']){
						this.resetStuff();
						window.audioContext.resume();
						this.gameState = 'playing';
						this.previousGameState = 'playing';
					}
					break;
				
				case 'playing':
					if(ui.frameCount>this.respiteFrames*0.7){
						if(ekeys['ArrowLeft']){
							this.keyHasBeenPressed.horizontal = -1;
						}
						if(ekeys["ArrowRight"]){
							this.keyHasBeenPressed.horizontal = 1;
						}
						if(ekeys["ArrowUp"]){
							this.keyHasBeenPressed.vertical = -1;
						}
						if(ekeys["ArrowDown"]){
							this.keyHasBeenPressed.vertical = 1;
						}
					}
					if(ekeys['k']){
						ui.se[5].play();
						if(this.score > this.highscore){this.highscore = this.score;}
						this.gameState = 'gameover';
						this.previousGameState = 'gameover';
					}
					
					break;
				
				case 'gameover':
					if(ekeys[' ']){
						this.resetStuff();
						this.gameState = 'playing';
						this.previousGameState = 'playing';
					}
					break;
				
				case 'escmenu':
					if(ekeys['f']){
						window.audioContext.resume();
						this.gameState = this.previousGameState;
					}
					if(ekeys['g']){
						ui.frameCount = 0;
						this.gameState = 'startscreen';
						this.previousGameState = 'startscreen';
					}
					if(ekeys['h']){
						this.help = !this.help;
						ekeys['h'] = false;
					}
					break;
			}
		}
		
	}
	
	window.Game = Game;
})();