import Ember from 'ember';
/* global Physics */
/* global screenfull */

export default Ember.Component.extend({
    classNames: ['ball-canvas-component'],

    VELOCITY_INCREMENT: 0.07,
    SIZE_INCREMENT: 3,

    tagName: 'section',
    width: function(){
        return this.$(window).width();
    }.property(),
    height: function(){
        return this.$(window).height();
    }.property(),

    paused: false,
    fullscreen: false,
    controlsHidden: false,
    changeColors: false,

    collisionsOn: false,
    collisionBehaviors: [
        Physics.behavior('body-collision-detection'),
        Physics.behavior('sweep-prune')
    ],

    gravityOn: false,
    gravityBehavior: Physics.behavior('constant-acceleration'),

    elasticityOn: true,

    activeColorScheme: 'sunset',
    colorSchemes: {
        'sunset': [
            '#FFE029',
            '#E87115',
            '#FF1614',
            '#86A4E8',
            '#1A28FF'
        ],
        'rainbow': [
            '#FF0000',
            '#FF7F00',
            '#FFFF00',
            '#00FF00',
            '#0000FF',
            '#4b0082',
            '#8B00FF'
        ],
        'icy': [
            '#022957',
            '#042E5A',
            '#4684C0',
            '#C0DAF2',
            '#7FC1F1'
        ],
        'magenta': [
            '#FF170C',
            '#DE0A53',
            '#B60ADE',
            '#8C0CF9',
            '#F501CF'
        ],
        'america': [
            '#D5D6DB',
            '#3E0311',
            '#C1233E',
            '#202E5B',
            '#5F85C0'
        ],
        'random': []
    },

    _generateBall: function() {
        return Physics.body('circle', {
            x: 50,
            y: 50,
            vx: Math.random(),
            vy: Math.random(),
            radius: Math.random() * (50 - 10) + 10,
            restitution: 1,
            cof: 0,
            styles: {
                fillStyle: this._sampleColor()
            }
        });
    },
    _init: function(){
        var renderer, world, viewWidth, viewHeight, element, self;
        self = this;

        Physics.body.mixin('collide', function(){
            //wall
            if(this.radius) {
                this.styles.fillStyle = self._sampleColor();
                this.view = undefined;
            }

            return true;
        });
        element = 'physics-canvas';

        viewWidth = this.get('width');
        viewHeight = this.get('height');

        world = new Physics({
            integrator: 'verlet',
            sleepDisabled: true
        });

        renderer = new Physics.renderer('canvas', {
            el: element,
            width: viewWidth,
            height: viewHeight,
            meta: false,
            styles: {
                'circle': {
                    lineWidth: 1,
                    fillStyle: 'blue',
                    background: 'black'
                }
            }
        });

        world.add(renderer);

        world.on('step', function(){
            world.render();
        });

        var viewportBounds = Physics.aabb(0, 0, viewWidth, viewHeight);

        // constrain objects to these bounds
        world.add(Physics.behavior('edge-collision-detection', {
            aabb: viewportBounds,
            restitution: 1
        }));

        //make balls bounce off the walls
        world.add(Physics.behavior('body-impulse-response'));
        //make bodies interactive
        world.add(Physics.behavior('interactive',{
            el: renderer.el
        }));

        Physics.util.ticker.on(function(time){
            world.step(time);
        });

        Physics.util.ticker.start();

        this._setupListeners(world);
        this.set('world',world);
    }.on('didInsertElement'),

    _setupListeners: function(world){
        var self = this;

        world.on('collisions:detected', function(data) {
            if(!self.get('changeColors')) {
                return;
            }
            var c;
            for (var i = 0, l = data.collisions.length; i < l; i++){
                c = data.collisions[ i ];
                if ( c.bodyA.collide ){
                    c.bodyA.collide( c.bodyB );
                }
                if ( c.bodyB.collide ){
                    c.bodyB.collide( c.bodyA );
                }
            }
        });
    },

    activateColorScheme: function(schemeName){
        var self = this;
        if(!this.get('colorSchemes')[schemeName]) {
            return;
        }
        self.set('activeColorScheme',schemeName);
        var world = this.get('world');
        world.getBodies().forEach(function(body){
            body.styles.fillStyle = self._sampleColor();
            body.view = undefined;
        });
    },

    _sampleColor: function () {
        var colorScheme = this.get('activeColorScheme');
        if(colorScheme === 'random') {
            return this._randomColor();
        }

        var colorSet = this.get('colorSchemes')[this.get('activeColorScheme')];
        return colorSet[Math.floor(Math.random() * colorSet.length)];
    },

    _randomColor: function() {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++ ) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    },

    toggleBallCollisions: function(world){
        var collisionsOn = this.get('collisionsOn');
        var behaviors = this.get('collisionBehaviors');
        if (collisionsOn) {
            world.removeBehavior(behaviors[0]);
            world.removeBehavior(behaviors[1]);
        }
        else {
            world.addBehavior(behaviors[0]);
            world.addBehavior(behaviors[1]);
        }
        this.set('collisionsOn', !this.get('collisionsOn'));
    },

    toggleGravityEffect: function(world) {
        var grav = this.get('gravityBehavior');
        this.get('gravityOn')? world.removeBehavior(grav) : world.addBehavior(grav);
        this.set('gravityOn',!this.get('gravityOn'));
    },

    toggleElasticBalls: function(world) {
        world.getBodies().forEach(function(body){
            body.restitution = body.restitution === 1? 0.7 : 1;
        });
        this.set('elasticityOn',!this.get('elasticityOn'));
    },

    changeSizeOfBodies: function(world, larger) {
        var bodies = world.getBodies(),
            INC = this.get('SIZE_INCREMENT');
        bodies.forEach(function(body){
            var change = larger? INC : -INC;
            if(change > 0 || (change < 0 && body.geometry.radius - INC > 0)) {
                body.geometry.radius += change;
            }
            body.view = undefined;
        });
    },

    makeBodiesFaster: function(world) {
        var INC = this.get('VELOCITY_INCREMENT');
        var bodies = world.getBodies();
        bodies.forEach(function(body){
            var oldX = body.state.vel.x,
                oldY = body.state.vel.y,
                x = oldX,
                y = oldY;
            if(x < 0) {
                x -= INC;
            }
            else {
                x += INC;
            }
            if(y < 0) {
                y -= INC;
            }
            else {
                y += INC;
            }

            body.state.vel.set(x,y);
        });
    },

    makeBodiesSlower: function(world) {
        var numSign = function(num) {
            return num?num<0?-1:1:0;
        };

        var INC = this.get('VELOCITY_INCREMENT');
        var bodies = world.getBodies();
        bodies.forEach(function(body){
            var x = body.state.vel.x,
                y = body.state.vel.y;

            if(x === 0 && y === 0) {
                return;
            }

            if(x < 0) {
                x += INC;
            }
            else {
                x -= INC;
            }
            if(y < 0) {
                y += INC;
            }
            else {
                y -= INC;
            }

            if(
                numSign(x) !== numSign(body.state.vel.x) ||
                numSign(y) !== numSign(body.state.vel.y)
            ) {
                return;
            }
            body.state.vel.set(x,y);
        });
    },

    actions: {
        speedBodiesUp: function(){
            this.makeBodiesFaster(this.get('world'));
        },
        slowBodiesDown: function(){
            this.makeBodiesSlower(this.get('world'));
        },
        growBodies: function() {
            this.changeSizeOfBodies(this.get('world'), true);
        },
        shrinkBodies: function(){
            this.changeSizeOfBodies(this.get('world'), false);
        },
        addOneBody: function(){
            this.get('world').add(this._generateBall());
        },
        removeOneBody: function() {
            var world = this.get('world');
            var bodies = world.getBodies();
            if(bodies.length > 0){
                world.removeBody(bodies[0]);
            }
        },
        toggleCollisionDetection: function() {
            this.toggleBallCollisions(this.get('world'));
        },
        pause: function() {
            var world = this.get('world');
            if(world.isPaused()) {
                world.unpause();
                this.set('paused',false);
            }
            else {
                world.pause();
                this.set('paused',true);
            }
        },
        toggleGravity: function() {
            this.toggleGravityEffect(this.get('world'));
        },
        toggleElasticity: function() {
            this.toggleElasticBalls(this.get('world'));
        },
        toggleFullscreen: function() {
            if(screenfull.enabled) {
                screenfull.toggle();
                this.set('fullscreen',!this.get('fullscreen'));
            }
        },
        toggleChangeColors: function() {
            this.set('changeColors',!this.get('changeColors'));
        },
        setColorScheme: function(schemeName) {
            this.activateColorScheme(schemeName);
        },
        toggleControls: function() {
            this.$('#controls').toggle();
            this.set('controlsHidden',!this.get('controlsHidden'));
        }
    }

});
