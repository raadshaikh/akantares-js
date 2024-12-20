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
			this.gameMode = 0; //0,1,2 = singleplayer, multiplayer offline, multiplayer online
			this.numGameModes = 2; //no multiplayer online yet
			this.whoseTurn = 0; //0,1 = player1 or player2
			this.gameState = 'loading'; //loading, startscreen, playing, escmenu, gameover. actually, no startscreen or gameover
			this.gameSubState = 'null'; //if gameState == 'playing', this can be 'ready', 'countdown', 'flying', 'collided', 'win','lose','draw'. otherwise it is 'null'.
			this.level = 0;
			this.help = false;
			this.previousGameState = 'loading';
			this.keyHasBeenPressed = {horizontal:0, vertical:0};
			
			this.score = [0,0];
			
			this.justStartedPlaying = true;
			
			this.dt = 0.05; //time step for integrating motion
			this.G = 3000; //universal gravitational constant
			this.initCatapultSpeed = 14;
			this.playerMass = 0.5;
			this.planetMass = 1; //sets the unit mass scale and is thus incorporated into the definition of G as well. do not change
			this.bigPlanetMass = 2;
			this.respiteFrames = 30; //# of frames at beginning when player gravity is disabled
			this.fadeinDuration = 0.2;
			this.resumeFrame = 0; //keep track of which frame you were on when paused, so that the game doesn't keep going in the background
			
			this.playerName = 'debugName';
			// this.playerName = window.prompt('Name: ');
			this.playerAngle = 360;
			this.playerPos = {x:40, y:window.height/2, h:false}; //h for whether it's been hit
			this.playerMissilePos = {x:this.playerPos.x+10*Math.cos(this.playerAngle*Math.PI/180), y:this.playerPos.y+10*Math.sin(this.playerAngle*Math.PI/180)};
			this.playerMissileVel = {x:0, y:0};
			this.playerMissileAcc = {x:0, y:0};
			this.playerTrail = [];
			this.playerCollided = false; //whether or not player's missile has collided with something
			this.enemyAngle = 360*Math.random();
			this.enemyPos = {x:256, y:window.height/2, h:false};
			this.enemyMissilePos = {x:this.enemyPos.x+10*Math.cos(this.enemyAngle*Math.PI/180), y:this.enemyPos.y+10*Math.sin(this.enemyAngle*Math.PI/180)};
			this.enemyMissileVel = {x:0, y:0};
			this.enemyMissileAcc = {x:0, y:0};
			this.enemyTrail = [];
			this.enemyCollided = false;
			
			this.resultString = '';
			
			// this.planets = []; //planets, not planetsPos, becase i'll also encode size in this (m=0 or 1), as well as hits endured
			// this.numPlanets = 1+Math.floor(4*Math.random());
			// for(let i=0; i<this.numPlanets; i++){
				// this.planets[i] = {x:60+160*Math.random(), y:12+200*Math.random(), m:(Math.random()<0.3), h:0};
			// }
			this.resetStuff('planets');
			
        
			this.debugInvulnerability = false;
		}
		
		fire(){
			if(this.gameMode!=2 || !this.justStartedPlaying){ //otherwise firing will cause the nameplates to re-popup (nameplates only used in online mode)
				ui.sfxs['OK'].play();
				
				if(this.gameMode==0 || this.whoseTurn>0){
					this.resultString = '';
					this.resetStuff('trail');
					this.resetStuff('shot');
				
					this.gameSubState = 'countdown';
					ui.frameCount = 0;
					document.getElementById('fireRange').style.visibility = 'hidden';
					document.getElementById('fireButton').disabled = true;
				}
				this.whoseTurn = this.whoseTurn + 1;
				ui.frameCount = 0;
			}
		}
		
		resetStuff(arg){ //make a separate resetGame and resetForNextLevel and reset after shot? yeah, make reset thingies for various cases
			for(let sfxName in ui.muteSFX){ui.muteSFX[sfxName]=false;}
			switch(arg){
				case 'trail':
					this.playerTrail = [];
					this.enemyTrail = [];
					break;
					
				case 'planets':
					this.resetStuff('trail');
					this.planets = [];
					this.numPlanets = 1+Math.floor(4*Math.random());
					for(let i=0; i<this.numPlanets; i++){
						this.planets[i] = {x:60+160*Math.random(), y:12+200*Math.random(), m:(Math.random()<0.3), h:0};
					}
					break;
					
				case 'gameover':
					this.score = [0,0];
					this.resetStuff('trail');
					this.resetStuff('planets');
					this.resetStuff('shot');
					this.justStartedPlaying = true;
					break;
				
				case 'shot':
					this.playerMissileVel.x = this.initCatapultSpeed*Math.cos(this.playerAngle*Math.PI/180);
					this.playerMissilePos.x = this.playerPos.x + 10*Math.cos(this.playerAngle*Math.PI/180);
					this.playerMissileVel.y = this.initCatapultSpeed*Math.sin(this.playerAngle*Math.PI/180);
					this.playerMissilePos.y = this.playerPos.y + 10*Math.sin(this.playerAngle*Math.PI/180);
					if(this.gameMode==0){this.enemyAngle = 360*Math.random();}
					this.enemyMissileVel.x = this.initCatapultSpeed*Math.cos(this.enemyAngle*Math.PI/180);
					this.enemyMissilePos.x = this.enemyPos.x + 10*Math.cos(this.enemyAngle*Math.PI/180);
					this.enemyMissileVel.y = this.initCatapultSpeed*Math.sin(this.enemyAngle*Math.PI/180);
					this.enemyMissilePos.y = this.enemyPos.y + 10*Math.sin(this.enemyAngle*Math.PI/180);
					
					this.playerPos.h = false;
					this.enemyPos.h = false;
					this.playerCollided = false;
					this.enemyCollided = false;
					this.whoseTurn = 0;
					
					if(this.resultString.slice(-3)=='hit'){this.resetStuff('planets');}
					this.planets = this.planets.filter((p)=>p.h-p.m<2);
					
					document.getElementById('fireRange').style.visibility = 'visible';
					document.getElementById('fireButton').disabled = false;
								
				break;
			}
			ui.frameCount = 0;
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
					if(document.getElementById('fireDiv').style.visibility=='hidden'){document.getElementById('fireDiv').style.visibility='visible';}
					if(ui.frameCount>1.5*window.fps){
						this.justStartedPlaying = false;
					}
										
					switch(this.gameSubState){
						
						case 'ready':
							if(this.whoseTurn==0){this.playerAngle = document.getElementById('fireRange').value;}
							else if(this.whoseTurn==1){this.enemyAngle = document.getElementById('fireRange').value;}
							break;
							
						case 'countdown':
							if(ui.frameCount > 2*window.fps){
								this.resultString = ''; //putting this here instead of in the reset function so that the ui script knows what happened last and can decide whether or not to fade-in
								this.gameSubState = 'flying';
								ui.frameCount=0;
							}
							break;
							
						case 'flying':
						
							//player missile movement
							if(!this.playerCollided){
								this.playerMissileAcc.x = 0;
								//respite frames disable the effect of gravity of the player for a bit at the beginning so that the catapult doesn't just get stuck orbiting the player
								if(ui.frameCount>this.respiteFrames) {this.playerMissileAcc.x -= this.G*this.playerMass*(this.playerMissilePos.x-this.playerPos.x)*dist2(this.playerMissilePos.x-this.playerPos.x, this.playerMissilePos.y-this.playerPos.y, 10)**-3;} //the dz=10 is to make sure it's always some distance away from the planet, to avoid singularities
								this.playerMissileAcc.x -= this.G*this.playerMass*(this.playerMissilePos.x-this.enemyPos.x)*dist2(this.playerMissilePos.x-this.enemyPos.x, this.playerMissilePos.y-this.enemyPos.y, 10)**-3;
								for(let i=0; i<this.planets.length; i++){
									this.playerMissileAcc.x -= this.G*(this.planets[i].m==0?this.planetMass:this.bigPlanetMass)*(this.playerMissilePos.x-this.planets[i].x)*dist2(this.playerMissilePos.x-this.planets[i].x, this.playerMissilePos.y-this.planets[i].y, 10+4*this.planets[i].m)**-3;
								}
								this.playerMissileVel.x += this.dt*this.playerMissileAcc.x;
								this.playerMissilePos.x += this.dt*this.playerMissileVel.x;
								
								this.playerMissileAcc.y = 0;
								if(ui.frameCount>this.respiteFrames) {this.playerMissileAcc.y -= this.G*(this.playerMissilePos.y-this.playerPos.y)*dist2(this.playerMissilePos.x-this.playerPos.x, this.playerMissilePos.y-this.playerPos.y, 10)**-3;}
								this.playerMissileAcc.y -= this.G*(this.playerMissilePos.y-this.enemyPos.y)*dist2(this.playerMissilePos.x-this.enemyPos.x, this.playerMissilePos.y-this.enemyPos.y, 10)**-3;
								for(let i=0; i<this.planets.length; i++){
									this.playerMissileAcc.y -= this.G*(this.planets[i].m==0?this.planetMass:this.bigPlanetMass)*(this.playerMissilePos.y-this.planets[i].y)*dist2(this.playerMissilePos.x-this.planets[i].x, this.playerMissilePos.y-this.planets[i].y, 10+4*this.planets[i].m)**-3;
								}
								this.playerMissileVel.y += this.dt*this.playerMissileAcc.y;
								this.playerMissilePos.y += this.dt*this.playerMissileVel.y;
							}
							//enemy missile movement
							if(!this.enemyCollided){
								this.enemyMissileAcc.x = 0;
								if(ui.frameCount>this.respiteFrames) {this.enemyMissileAcc.x -= this.G*this.playerMass*(this.enemyMissilePos.x-this.enemyPos.x)*dist2(this.enemyMissilePos.x-this.enemyPos.x, this.enemyMissilePos.y-this.enemyPos.y, 10)**-3;}
								this.enemyMissileAcc.x -= this.G*this.playerMass*(this.enemyMissilePos.x-this.playerPos.x)*dist2(this.enemyMissilePos.x-this.playerPos.x, this.enemyMissilePos.y-this.playerPos.y, 10)**-3;
								for(let i=0; i<this.planets.length; i++){
									this.enemyMissileAcc.x -= this.G*(this.planets[i].m==0?this.planetMass:this.bigPlanetMass)*(this.enemyMissilePos.x-this.planets[i].x)*dist2(this.enemyMissilePos.x-this.planets[i].x, this.enemyMissilePos.y-this.planets[i].y, 10+4*this.planets[i].m)**-3;
								}
								this.enemyMissileVel.x += this.dt*this.enemyMissileAcc.x;
								this.enemyMissilePos.x += this.dt*this.enemyMissileVel.x;
								
								this.enemyMissileAcc.y = 0;
								if(ui.frameCount>this.respiteFrames) {this.enemyMissileAcc.y -= this.G*this.playerMass*(this.enemyMissilePos.y-this.enemyPos.y)*dist2(this.enemyMissilePos.x-this.enemyPos.x, this.enemyMissilePos.y-this.enemyPos.y, 10)**-3;}
								this.enemyMissileAcc.y -= this.G*this.playerMass*(this.enemyMissilePos.y-this.playerPos.y)*dist2(this.enemyMissilePos.x-this.playerPos.x, this.enemyMissilePos.y-this.playerPos.y, 10)**-3;
								for(let i=0; i<this.planets.length; i++){
									this.enemyMissileAcc.y -= this.G*(this.planets[i].m==0?this.planetMass:this.bigPlanetMass)*(this.enemyMissilePos.y-this.planets[i].y)*dist2(this.enemyMissilePos.x-this.planets[i].x, this.enemyMissilePos.y-this.planets[i].y, 10+4*this.planets[i].m)**-3;
								}
								this.enemyMissileVel.y += this.dt*this.enemyMissileAcc.y;
								this.enemyMissilePos.y += this.dt*this.enemyMissileVel.y;
							}
							
							if(ui.frameCount%15 == 0){
								this.playerTrail.push({x:this.playerMissilePos.x, y:this.playerMissilePos.y});
								this.enemyTrail.push({x:this.enemyMissilePos.x, y:this.enemyMissilePos.y});
							}
							
							
							
							//collisions
					
							if(!this.debugInvulnerability && ui.frameCount>this.respiteFrames){
								
								//playerMissile - enemy
								if(abs(this.playerMissilePos.x-this.enemyPos.x)<10 && abs(this.playerMissilePos.y-this.enemyPos.y)<10){
									if(!this.playerCollided){this.score[0] += 1; ui.sfxs['HIT'].play();} //if not for this condition, the score would keep increasing
									this.enemyPos.h = true;
									this.playerCollided = true;
									if(this.resultString=='player_1hit'){this.resultString = '2hit';}
									else{this.resultString='enemy_1hit'}
								}
								//enemyMissile - enemy
								if(abs(this.enemyMissilePos.x-this.enemyPos.x)<10 && abs(this.enemyMissilePos.y-this.enemyPos.y)<10){
									
									if(!this.enemyCollided){this.score[0] += 1; ui.sfxs['HIT'].play();}
									this.enemyPos.h = true;
									this.enemyCollided = true;
									if(this.resultString=='player_1hit'){this.resultString = '2hit';}
									else{this.resultString='enemy_1hit'}
								}
								//enemyMissile - player
								if(abs(this.enemyMissilePos.x-this.playerPos.x)<10 && abs(this.enemyMissilePos.y-this.playerPos.y)<10){
									
									if(!this.enemyCollided){this.score[1] += 1; ui.sfxs['HIT'].play();}
									this.playerPos.h = true;
									this.enemyCollided = true;
									if(this.resultString=='enemy_1hit'){this.resultString = '2hit';}
									else{this.resultString='player_1hit'}
								}
								//playerMissile - player
								if(abs(this.playerMissilePos.x-this.playerPos.x)<10 && abs(this.playerMissilePos.y-this.playerPos.y)<10){
									
									if(!this.playerCollided){this.score[1] += 1; ui.sfxs['HIT'].play();}
									this.playerPos.h = true;
									this.playerCollided = true;
									if(this.resultString=='enemy_1hit'){this.resultString = '2hit';}
									else{this.resultString='player_1hit'}
								}
								
								//playerMissile - planets
								for(let i=0; i<this.planets.length; i++){
									if(abs(this.playerMissilePos.x-this.planets[i].x)<10+4*this.planets[i].m && abs(this.playerMissilePos.y-this.planets[i].y)<10+4*this.planets[i].m){
										if(!this.playerCollided){this.planets[i].h += 1; ui.sfxs['HIT'].play();}
										this.playerCollided = true;
										if(this.resultString==''){this.resultString = 'miss';}
									}
								}
								//enemyMissile - planets
								for(let i=0; i<this.planets.length; i++){
									if(abs(this.enemyMissilePos.x-this.planets[i].x)<10+4*this.planets[i].m && abs(this.enemyMissilePos.y-this.planets[i].y)<10+4*this.planets[i].m){
										if(!this.enemyCollided){this.planets[i].h += 1; ui.sfxs['HIT'].play();}
										this.enemyCollided = true;
										if(this.resultString==''){this.resultString = 'miss';}
									}
								}
								
								if(ui.frameCount > 15*window.fps){
									if(!this.playerCollided && !this.enemyCollided){this.resultString = 'miss';}
									this.playerCollided = true;
									this.enemyCollided = true;
								}
								
								if(this.playerCollided && this.enemyCollided){
									this.gameSubState = 'collided';
									if(this.resultString.slice(-3)=='hit'){this.resultString=this.resultString.slice(-4);}
									ui.frameCount = 0;
								}
							}
					
							break;
							
						case 'collided':
							if(ui.frameCount>3*window.fps){
								this.playerCollided = false;
								this.enemyCollided = false;
								
								if(this.score[0] >= 5 && this.score[1] >= 5){
									this.gameSubState = 'draw';
								}
								else if(this.score[0] >= 5){
									this.gameSubState = 'win';
								}
								else if(this.score[1] >= 5){
									this.gameSubState = 'lose';
								}
								else{
									this.resetStuff('shot');
									this.gameSubState = 'ready';
									ui.frameCount = 0;
									if(this.resultString=='1hit' || this.resultString=='2hit'){ui.frameCount = -this.fadeinDuration*window.fps;} //for the fade-in animation. to let the ui script know, i'm encoding this info in the fact that the frame counter is negative.
								}
							}
			
							break;
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
				resizeSlider();
				ekeys['z'] = false;
			}
			if(ekeys['Escape']){
				if(this.gameState != 'escmenu' && this.gameMode != 2){ //can't pause when already paused, and can't pause online games
					window.audioContext.suspend();
					this.resumeFrame = ui.frameCount;
					this.gameState = 'escmenu';
					ekeys['Escape'] = false;
				}
			}
			switch(this.gameState){
				case 'loading':
					if(ekeys[' ']){
						ekeys[' ']=false;
						this.gameState = 'startscreen';
						this.gameSubState = 'null';
						this.previousGameState = 'startscreen';
						ui.startscreenAnim = Math.floor(2*Math.random());
						ui.frameCount = -this.fadeinDuration*window.fps;
					}
					break;
				case 'startscreen':
					if(ekeys['ArrowUp']){
						this.gameMode = (this.gameMode + this.numGameModes-1)%this.numGameModes; //+3-1 because just doing -1 leads to negative results for the modulo function
						ui.sfxs['SELECT'].play();
						ekeys['ArrowUp'] = false;
					}
					if(ekeys['ArrowDown']){
						this.gameMode = (this.gameMode + 1)%this.numGameModes;
						ui.sfxs['SELECT'].play();
						ekeys['ArrowDown'] = false;
					}
					if(ekeys[' ']){
						ekeys[' ']=false;
						this.resetStuff('gameover');
						window.audioContext.resume();
						ui.sfxs['OK'].play();
						this.gameState = 'playing';
						this.gameSubState = 'ready';
						this.previousGameState = 'playing';
						ui.frameCount = -this.fadeinDuration*window.fps; //fade-in animation
					}
					break;
				
				case 'playing':
					
					if(this.gameSubState == 'ready'){
						if(ekeys['ArrowLeft']){
							if(this.whoseTurn == 0){
								this.playerAngle -= (3-2*ekeys['Shift']); //holding shift for finer control
								document.getElementById('fireRange').value = (this.playerAngle+360)%360; //periodic boundary conditions as the slider represents an azimuthal angle
							}
							else if(this.whoseTurn == 1){
								this.enemyAngle -= (3-2*ekeys['Shift']);
								document.getElementById('fireRange').value = (this.enemyAngle+360)%360;
							}
						}
						if(ekeys['ArrowRight']){
							if(this.whoseTurn == 0){
								this.playerAngle -= -(3-2*ekeys['Shift']); //using += 1 instantly slides it all the way to max. why the heck?
								document.getElementById('fireRange').value = (this.playerAngle+360)%360;
							}
							else if(this.whoseTurn == 1){
								this.enemyAngle -= -(3-2*ekeys['Shift']);
								document.getElementById('fireRange').value = (this.enemyAngle+360)%360;
							}
						}
						if(ekeys[' ']){
							this.fire();
							ekeys[' '] = false;
						}
					}
					
					if(this.gameSubState == 'win' || this.gameSubState == 'loss' || this.gameSubState =='draw'){
						if(ekeys[' ']){
							this.resetStuff('gameover');
							this.gameState = 'playing';
							this.gameSubState = 'ready';
							this.previousGameState = 'playing';
							ekeys[' '] = false;
							ui.frameCount = -this.fadeinDuration*window.fps;
						}
					}
					
					break;
				
				case 'gameover':
					if(ekeys[' ']){
						this.resetStuff('gameover');
						this.gameState = 'playing';
						this.previousGameState = 'playing';
					}
					break;
				
				case 'escmenu':
					if(ekeys['f']){
						window.audioContext.resume();
						ui.frameCount = this.resumeFrame;
						this.gameState = this.previousGameState;
					}
					if(ekeys['g']){
						ui.frameCount = 0;
						ui.stop_bgm();
						window.audioContext.resume();
						this.gameState = 'loading';
						this.previousGameState = 'loading';
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