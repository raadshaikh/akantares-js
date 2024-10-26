(() => {
	
	//mod function
	function abs(x){
		return x>0 ? x : -1*x;
	}
	//pythagoras
	function dist2(dx, dy){
		return (dx**2 + dy**2)**0.5;
	}
	
    class GameUI {
        /**
         * @param {HTMLCanvasElement} canvas 
         */
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext("2d");
			this.ctx.scale(window.scale, window.scale); //zoom
			this.ctx.imageSmoothingEnabled = false;
            this.game = null;
            this.requested = false;
			
			this.startscreenAnim = Math.floor(2*Math.random()); //randomly choosing one of two title screen animation styles
			this.pushSpace = 'Push Space';
			
			if ("ontouchstart" in window) {
				this.ctx.scale(window.scale, window.scale);
				this.ctx.imageSmoothingEnabled = false;
				
				this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
                this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
                this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
				
				this.pushSpace = 'Press Anywhere';
            }
			
			
			this.bmps = {};
			const bmp_names = `CATAPULT
COLOR1
FADE_H
FADE_V
FONT_1
FRAME_B
FRAME_H
FRAME_M
FRAME_V
KEYCODE
MISSILE
NAMEPLATE
PLANET
RESULT
STARTSCREEN
THREE
TITLE
WINMARK`.split('\n');
			for (const i in bmp_names){
				this.bmps[bmp_names[i]] = new Image();
				this.bmps[bmp_names[i]].src = "BITMAP/BMP_"+bmp_names[i]+".png";
            	this.bmps[bmp_names[i]].addEventListener("load", this.onImageLoad.bind(this));
			}
			
			this.frameCount = 0;
			
			this.bgm_names = `STARTSCREEN
READY
FLYING
GAMEOVER
XXXX`.split('\n');
			this.bgms = {};
			this.bgmURLs = {};
			this.bgms_playing = {};
			for(const i in this.bgm_names){
				this.bgmURLs[this.bgm_names[i]] = new URL('https://raadshaikh.github.io/akantares-js/WAVE/BGM_'+this.bgm_names[i]+'.wav');
				this.bgms[this.bgm_names[i]] = new Audio(this.bgmURLs[this.bgm_names[i]]);
				this.bgms[this.bgm_names[i]].crossOrigin = 'anonymous';
				this.bgms[this.bgm_names[i]].playing = false;
			}
			
			const sfx_names = `CANCEL
ERROR
EXPLODE
HIT
MOVE
OK
READY
SELECT
THREE`.split('\n');
			this.sfxs = {};
			for(const i in sfx_names){
				this.sfxs[sfx_names[i]] = new Audio(new URL('https://raadshaikh.github.io/akantares-js/WAVE/PTN_'+sfx_names[i]+'.wav'));
			}
			this.muteSFX = {}; //so they don't play repeatedly. will reset using resetStuff in the other script.
			
			window.audioContext = new AudioContext();
			this.buffer = 0;
			this.source = 0;
        }
		
        async loadAudio(bgmName) {
			  try {
				const response = await fetch(this.bgmURLs[bgmName]);
				// Decode it
				this.buffer = await window.audioContext.decodeAudioData(await response.arrayBuffer());
			  } catch (err) {
				console.error(`Unable to fetch the audio file. Error: ${err.message}`);
			  }
		}
        async play_bgm(bgmName){
				await this.loadAudio(bgmName);
				this.source = window.audioContext.createBufferSource();
				this.source.loop = true;
				this.source.buffer = this.buffer;
				this.source.connect(window.audioContext.destination);
				this.source.start();
		}
		async stop_bgm(){
			if(this.source){
				for(let i in this.bgm_names){this.bgms_playing[this.bgm_names[i]] = false;}
				this.source.stop();
				}
		}
		
        onTouchStart(e) {
            this.touching = true;
            this.touchX = e.touches[0].clientX - this.canvas.getBoundingClientRect().x;
            this.touchY = e.touches[0].clientY - this.canvas.getBoundingClientRect().y;
			this.touchX /= window.scale;
			this.touchY /= window.scale;
			var x = this.touchX - window.width/2;
			var y = -this.touchY + window.height/2;
			var r = dist2(x,y);
			window.keysBeingPressed[' '] = !(this.game.gameState=='escmenu') && !(this.touchX<32 && this.touchY<32);
			window.keysBeingPressed['Escape'] = (this.touchX<32 && this.touchY<32);
			window.keysBeingPressed['f'] = (this.touchX>60 && this.touchX<160 && this.touchY<100);
			window.keysBeingPressed['g'] = (this.touchX>160 && this.touchX<240 && this.touchY<100);
			window.keysBeingPressed['h'] = (this.touchX>240 && this.touchY<100);
        }

        onTouchMove(e) {
            if (this.touching) {
                e.preventDefault();
				window.keysBeingPressed[' '] = false;
                this.touchX = e.touches[0].clientX - this.canvas.getBoundingClientRect().x;
                this.touchY = e.touches[0].clientY - this.canvas.getBoundingClientRect().y;
				this.touchX /= window.scale;
				this.touchY /= window.scale;
				var x = this.touchX - window.width/2;
				var y = -this.touchY + window.height/2;
				var r = dist2(x,y);
				var theta = Math.atan2(y,x);
				// console.log(theta*180/Math.PI);
				window.keysBeingPressed['ArrowRight'] = (abs(theta-0)<2*Math.PI*1.5/8);
				window.keysBeingPressed['ArrowUp'] = (abs(theta-Math.PI/2)<2*Math.PI*1.5/8);
				window.keysBeingPressed['ArrowLeft'] = ((abs(theta-Math.PI)<2*Math.PI*1.5/8) || (abs(theta - -Math.PI)<2*Math.PI*1.5/8)); //branch cut at \pm\pi
				window.keysBeingPressed['ArrowDown'] = (abs(theta - -Math.PI/2)<2*Math.PI*1.5/8);
            }
        }

        onTouchEnd() {
            this.touching = false;
            this.touchX = 0;
            this.touchY = 0;
			window.keysBeingPressed = {
			'ArrowLeft': false,
			'ArrowRight': false,
			'ArrowUp': false,
			'ArrowDown': false,
			'Escape': false,
			' ': false,
			'f': false,
			'g': false,
			'k': false,
			};
        }
        

        onImageLoad() {
			let all_loaded = false;
			for (const bmp_name in this.bmps){
				all_loaded = all_loaded && this.bmps[bmp_name].complete;
			}
            if (all_loaded) {
                this.onUpdate();
            }
        }
		
        setGame(game) {
            this.game = game;
            this.game.onUpdate = this.draw.bind(this);
        }

        drawNumber(x, y, number, zeroPad = 0, rtl=false) { //uses the pixel aquarium font found in bmp_keycode. there are two other sets of number glyphs in bmp_font_1, i have not bothered implementing those.
            let str = number.toString();
            while (str.length < zeroPad) {
                str = "0" + str;
            }
			if (rtl==false) {
				for (let i = 0; i < str.length; i++) {
					this.ctx.drawImage(this.bmps['KEYCODE'], (str.charCodeAt(i) - 0x30) * 8, 24, 8, 8, x-1 + 7*i, y, 8, 8);
				}
			}
			else if(rtl==true) //right-to-left, for right-aligned numbers
				for (let i = str.length-1; i >= 0; i--) {
					this.ctx.drawImage(this.bmps['KEYCODE'], (str.charCodeAt(i) - 0x30) * 8, 24, 8, 8, x-1 - 7*(str.length-i), y, 8, 8);
				}
        }
		
		drawString(x, y, str, zoom=1){
			let newlines = [0];
			for(let i=0; i<str.length; i++){
				if(str[i]=='\n'){newlines.push(i);}
				if(str.charCodeAt(i)>=0x20){
					this.ctx.drawImage(this.bmps['FONT_1'], 8*((str.charCodeAt(i)-0x20)%32), 12*~~((str.charCodeAt(i)-0x20)/32), 8, 12, x+6*(i-newlines[newlines.length-1]-(newlines.length>1))*zoom, y+12*(newlines.length-1)*zoom -2, 8*zoom, 12*zoom); //~~ is shortcut for floor function somehow
				}
			}
		}

        onUpdate() {
            if (this.requested) return;
            this.requested = true;
            window.requestAnimationFrame(this.draw.bind(this));
        }

        draw() {
            this.requested = false;

            const { width, height } = this.canvas;
			this.ctx.fillStyle = '#0a1826';
			this.ctx.fillRect(0, 0, width, height);
			
			switch(this.game.gameState) {
				case 'loading':
					this.drawString(130-6*(this.pushSpace.length-10)/2,window.height/2-4,'...Loaded!\n\n'+this.pushSpace);
					break;
					
				case 'startscreen':
					if(!this.bgms_playing['STARTSCREEN']){
						this.stop_bgm();
						this.play_bgm('STARTSCREEN');
						this.bgms_playing['STARTSCREEN'] = true;
					}
					if(this.frameCount<0){ //fade-in animation
						let t = 1-Math.abs(this.frameCount/(this.game.fadeinDuration*window.fps)); //0 to 1, parameterising the fade completion
						this.ctx.beginPath();
						this.ctx.lineWidth = (1-t)*window.height;
						this.ctx.rect(0,0,window.width,window.height);
						this.ctx.stroke();
					}
					// this.ctx.drawImage(this.bmps['STARTSCREEN'], 0,0,320,240, 0,0,320,240); //old boring title screen graphic
					this.drawString(52,92,'AKANTARES',4);
					this.ctx.drawImage(this.bmps['TITLE'], 8, 32, 112, 8, 100, 140, 112, 8);
					//UBER COOL-LOOKING ANIMATION THINGY!!!
					if(this.startscreenAnim == 0){
						for(let i=0; i<10; i++){
							this.ctx.drawImage(this.bmps['PLANET'],43,35,1,1, window.width/2+132*Math.cos(-0.01*(this.frameCount-i*20)), window.height/2-4+68*Math.sin(-0.01*(this.frameCount-i*20)), 1,1);
							this.ctx.drawImage(this.bmps['PLANET'],59,35,1,1, window.width/2+132*Math.cos(-0.01*(this.frameCount-i*20)+Math.PI), window.height/2-4+68*Math.sin(-0.01*(this.frameCount-i*20)+Math.PI), 1,1);
						}
					}
					//alternate animation
					else{
						for(let i=0; i<16; i++){
							this.ctx.drawImage(this.bmps['PLANET'],43,35,1,1, window.width/2+132*Math.cos(-0.01*(this.frameCount-this.frameCount%20-i*20)), window.height/2-4+68*Math.sin(-0.01*(this.frameCount-this.frameCount%20-i*20)), 1,1);
							this.ctx.drawImage(this.bmps['PLANET'],59,35,1,1, window.width/2+132*Math.cos(-0.01*(this.frameCount-this.frameCount%20-i*20)+Math.PI), window.height/2-4+68*Math.sin(-0.01*(this.frameCount-this.frameCount%20-i*20)+Math.PI), 1,1);
						}
					}
					this.ctx.drawImage(this.bmps['PLANET'],0,0,16,16, window.width/2+132*Math.cos(-0.01*this.frameCount)-16/2, window.height/2-4+68*Math.sin(-0.01*this.frameCount)-16/2, 16,16);
					this.ctx.drawImage(this.bmps['PLANET'],0,16,16,16, window.width/2+132*Math.cos(-0.01*this.frameCount+Math.PI)-16/2, window.height/2-4+68*Math.sin(-0.01*this.frameCount+Math.PI)-16/2, 16,16);
					this.drawString(126-6*(this.pushSpace.length-10)/2, window.height-24, this.pushSpace+'.'.repeat(Math.abs(this.frameCount)/30%4));
					break;
					
				
				case 'playing':
					
					for (let i=0; i<5; i++){
						this.ctx.drawImage(this.bmps['WINMARK'], 8*(i<this.game.score[0]),0,8,8, 8,100+i*8,8,8);
						this.ctx.drawImage(this.bmps['WINMARK'], 8*(i<this.game.score[1]),0,8,8, 304,100+i*8,8,8);
					}
					
					if(!(this.game.gameSubState=='collided' && this.game.playerPos.h)){this.ctx.drawImage(this.bmps['PLANET'], 0+16*(this.frameCount%6==0 && this.game.playerPos.h),0+32*(this.frameCount%6==0 && this.game.playerPos.h),16,16, this.game.playerPos.x-16/2, this.game.playerPos.y-16/2, 16,16);} //player planet. alternate with white circle after getting hit but before conclusion of the overall shot. don't draw if it has been hit and exploding animation is ongoing.
					if(!(this.game.gameSubState=='collided' && this.game.enemyPos.h)){this.ctx.drawImage(this.bmps['PLANET'], 0+16*(this.frameCount%6==0 && this.game.enemyPos.h),16+16*(this.frameCount%6==0 && this.game.enemyPos.h),16,16, this.game.enemyPos.x-16/2, this.game.enemyPos.y-16/2, 16,16);} //enemy planet
					this.ctx.drawImage(this.bmps['CATAPULT'], 4*(this.frameCount%10<5 && this.game.gameSubState=='ready')+1, 1, 3, 3, this.game.playerPos.x+10*Math.cos(this.game.playerAngle*Math.PI/180)-3/2, this.game.playerPos.y+10*Math.sin(this.game.playerAngle*Math.PI/180)-3/2, 3, 3); //player catapult
					this.ctx.drawImage(this.bmps['CATAPULT'], 1, 1, 3, 3, this.game.enemyPos.x+10*Math.cos(this.game.enemyAngle*Math.PI/180)-3/2, this.game.enemyPos.y+10*Math.sin(this.game.enemyAngle*Math.PI/180)-3/2, 3, 3); //enemy catapult
					for(let i=0; i<this.game.playerTrail.length; i++){
						this.ctx.drawImage(this.bmps['PLANET'], 43, 35, 1,1, this.game.playerTrail[i].x, this.game.playerTrail[i].y, 1,1); //playerMissile trail
					}
					for(let i=0; i<this.game.enemyTrail.length; i++){
						this.ctx.drawImage(this.bmps['PLANET'], 59, 35, 1,1, this.game.enemyTrail[i].x, this.game.enemyTrail[i].y, 1,1); //enemyMissile trail
					}
					if(this.game.playerCollided){this.ctx.drawImage(this.bmps['MISSILE'], 32+16*(this.frameCount%2),0,16,16, this.game.playerMissilePos.x-16/2,this.game.playerMissilePos.y-16/2,16,16);} //playerMissile explosion
					if(this.game.enemyCollided){this.ctx.drawImage(this.bmps['MISSILE'], 32+16*(this.frameCount%2),0,16,16, this.game.enemyMissilePos.x-16/2,this.game.enemyMissilePos.y-16/2,16,16);} //enemyMissile explosion
					for(let i=0; i<this.game.planets.length; i++){
						let m_i = this.game.planets[i].m;
						let h_i = this.game.planets[i].h;
						if(!(this.game.gameSubState=='collided' && h_i-m_i>=2)){this.ctx.drawImage(this.bmps['PLANET'], 0+(16+8*m_i)*(this.frameCount%6==0 && h_i>0),32+16*m_i, 16+8*m_i,16+8*m_i, this.game.planets[i].x-8-4*m_i, this.game.planets[i].y-8-4*m_i, 16+8*m_i,16+8*m_i);} //grey planets
					}
					
					if(this.game.justStartedPlaying){
						let t = this.frameCount/(1.5*window.fps); //cool nameplate sliding up animation
						t = Math.min(0.5+8*t,1);
						this.ctx.drawImage(this.bmps['NAMEPLATE'], 0,0,64,t*24, this.game.playerPos.x-64/2, this.game.playerPos.y-16/2-t*24, 64,t*24)
						this.ctx.drawImage(this.bmps['NAMEPLATE'], 0,0,64,t*24, this.game.enemyPos.x-64/2, this.game.enemyPos.y-16/2-t*24, 64,t*24);
						this.ctx.font = '9px courier new';
						this.ctx.textAlign = 'center';
						this.ctx.fillText(this.game.playerName, this.game.playerPos.x, this.game.playerPos.y-16/2-24/2); //12 letters fit in the nameplate at 9px courier new
						this.ctx.fillText('enemy', this.game.enemyPos.x, this.game.enemyPos.y-16/2-24/2);
					}
					
					if(this.game.gameSubState == 'ready'){
						if(!this.bgms_playing['READY']){
							this.stop_bgm();
							this.play_bgm('READY');
							this.bgms_playing['READY'] = true;
						}
						this.drawString(14, 218 + (20-2*this.frameCount)*(this.frameCount<0.2*window.fps), 'Please Take your shot'+'.'.repeat(Math.abs(this.frameCount)/30%4));
					}
					
					if(this.game.gameSubState == 'countdown'){
						if(!this.bgms_playing['XXXX']){
							this.stop_bgm();
							this.play_bgm('XXXX');
							this.bgms_playing['XXXX'] = true;
						}
						if(this.frameCount%(0.5*window.fps)==0 && this.frameCount!=0){
							this.sfxs['THREE'].play();
						}
						this.ctx.drawImage(this.bmps['THREE'], 16*(~~(this.frameCount/(0.5*window.fps))-1), 0, 16, 16, window.width/2-16/2, window.height/2-16/2, 16, 16);
					}
					
					if(this.game.gameSubState == 'flying') {
						if(!this.bgms_playing['FLYING']){
							this.stop_bgm();
							this.play_bgm('FLYING');
							this.bgms_playing['FLYING'] = true;
						}
						if(!this.game.playerCollided){this.ctx.drawImage(this.bmps['MISSILE'], 3+8*(this.frameCount>5*window.fps)+8*(this.frameCount>10*window.fps), 3, 3, 3, this.game.playerMissilePos.x-3/2, this.game.playerMissilePos.y-3/2, 3, 3);}
						if(!this.game.enemyCollided){this.ctx.drawImage(this.bmps['MISSILE'], 3+8*(this.frameCount>5*window.fps)+8*(this.frameCount>10*window.fps), 3, 3, 3, this.game.enemyMissilePos.x-3/2, this.game.enemyMissilePos.y-3/2, 3, 3);}
					}
					
					if(this.game.gameSubState == 'collided') {
						for(let i=0; i<this.game.planets.length; i++){
							let m_i = this.game.planets[i].m;
							let h_i = this.game.planets[i].h;
							//exploding planet animation. i'm a little bummed at how there's no nice way to let this animation play and extend this into the next shot a little bit, like it does in the game. oh well.
							if(h_i-m_i>=2){
								if(!this.muteSFX['EXPLODE']){this.sfxs['EXPLODE'].play();}
								this.muteSFX['EXPLODE'] = true;
								for(let j=0; j<5; j++){ //5 exploding bits
									this.ctx.drawImage(this.bmps['PLANET'], 64,32+8*(this.frameCount%10<5), 8,8, this.game.planets[i].x-0.4*this.frameCount*Math.cos(j*2*Math.PI/5+Math.PI/2), this.game.planets[i].y-0.4*this.frameCount*Math.sin(j*2*Math.PI/5+Math.PI/2), 8,8);
								}
							}
						}
						if(this.game.playerPos.h){
							if(!this.muteSFX['EXPLODE']){this.sfxs['EXPLODE'].play();}
							this.muteSFX['EXPLODE'] = true;
							for(let j=0; j<5; j++){
								this.ctx.drawImage(this.bmps['PLANET'], 32,32+8*(this.frameCount%10<5), 8,8, this.game.playerPos.x-0.4*this.frameCount*Math.cos(j*2*Math.PI/5+Math.PI/2)-8/2, this.game.playerPos.y-0.4*this.frameCount*Math.sin(j*2*Math.PI/5+Math.PI/2)-8/2, 8,8);
							}
						}
						if(this.game.enemyPos.h){
							if(!this.muteSFX['EXPLODE']){this.sfxs['EXPLODE'].play();}
							this.muteSFX['EXPLODE'] = true;
							for(let j=0; j<5; j++){
								this.ctx.drawImage(this.bmps['PLANET'], 48,32+8*(this.frameCount%10<5), 8,8, this.game.enemyPos.x-0.4*this.frameCount*Math.cos(j*2*Math.PI/5+Math.PI/2)-8/2, this.game.enemyPos.y-0.4*this.frameCount*Math.sin(j*2*Math.PI/5+Math.PI/2)-8/2, 8,8);
							}
						}
						if(this.game.resultString=='1hit'){this.ctx.drawImage(this.bmps['RESULT'], 0,4,40,16, window.width/2-40/2,window.height/2-16/2,40,16);}
						if(this.game.resultString=='miss'){this.ctx.drawImage(this.bmps['RESULT'], 0,28,68,16, window.width/2-68/2,window.height/2-16/2,68,16);}
						if(this.game.resultString=='2hit'){this.ctx.drawImage(this.bmps['RESULT'], 0,52,68,16, window.width/2-68/2,window.height/2-16/2,68,16);}
						
					}
					
					if(['win', 'lose', 'draw'].includes(this.game.gameSubState)){
						if(!this.bgms_playing['GAMEOVER']){
							this.stop_bgm();
							this.play_bgm('GAMEOVER');
							this.bgms_playing['GAMEOVER'] = true;
						}
						this.ctx.drawImage(this.bmps['RESULT'], 0, 72+40*(this.game.gameSubState=='lose')+80*(this.game.gameSubState=='draw'), 112, 40, window.width/2-112/2, window.height/2-40/2, 112, 40);
						this.drawString(126-6*(this.pushSpace.length-10)/2, window.height-20, this.pushSpace+'.'.repeat(Math.abs(this.frameCount)/30%4));
					}
					
					if(this.frameCount<0){ //fade-in animation after a scoring shot
						let t = 1-Math.abs(this.frameCount/(this.game.fadeinDuration*window.fps)); //0 to 1, parameterising the fade completion
						this.ctx.beginPath();
						this.ctx.lineWidth = (1-t)*window.height;
						this.ctx.rect(0,0,window.width,window.height);
						this.ctx.stroke();
					}
					
					break;
				
				case 'gameover':
					//this has been subsumed into substates of 'playing'
					break;
					
				case 'escmenu':
					for(let i in this.bgm_names){this.bgms[this.bgm_names[i]].pause();}
					this.drawString(0,0,'CONTINUE:F');
					this.drawString(0,8,'RESET   :G');
					this.drawString(0,16,'HELP    :H');
					if ('ontouchstart' in window) {
						this.ctx.filter = 'brightness(50%)';
						for(let i=0;i<3;i++){this.ctx.drawImage(this.bmps['PLANET'],0,48,24,24,80+i*82,26,68,68);} //bubbles around FGH
						this.ctx.filter = 'brightness('+(65+20*Math.floor((this.frameCount+Math.floor(60*Math.random()))%100==0)).toString()+'%)'; //randomish blinking effect on FGH
						this.drawString(104,28,'F', 5);
						this.drawString(104+80*1,28,'G', 5);
						this.drawString(104+80*2,28,'H', 5);
						this.ctx.filter = 'none';
					}
					if(this.game.help){
						this.drawString(0,window.height/2,"GOAL: Set your aim and fire at your opponent,   \n      while avoiding obstacles!\n      Remember, all objects on screen have gravity.\n\nPress ESC for pause menu.\nPress Z to toggle 2x zoom.\n\nAkantares (c) 2009, Studio Pixel\nBrowser version and music by IdioticBaka1824");
					}
					break;
					
				default:
					break;
			}
			
			if(('ontouchstart' in window) && this.game.gameState!='escmenu'){
				this.ctx.globalAlpha = 0.12;
				// this.ctx.drawImage(this.bmps['PLANET'],0,32,16,16,0,0,32,32);
				this.drawString(8,10,'Esc');
				this.ctx.globalAlpha = 1;
			}
			
			this.frameCount += 1;
			
        }
    }

    window.GameUI = GameUI;
	
})();