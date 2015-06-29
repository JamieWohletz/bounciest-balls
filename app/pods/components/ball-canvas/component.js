import Ember from 'ember';
/* global Physics */

export default Ember.Component.extend({
    VELOCITY_INCREMENT: .07,

    tagName: 'section',
    width: function(){
        return this.$(window).width();
    }.property(),
    height: function(){
        return this.$(window).height();
    }.property(),

    paused: false,

    collisionsOn: false,
    collisionBehaviors: [
        Physics.behavior('body-collision-detection'),
        Physics.behavior('sweep-prune')
    ],

    gravityOn: false,
    gravityBehavior: Physics.behavior('constant-acceleration'),

    elasticityOn: true,

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
                fillStyle: this._getRandomColor()
            }
        });
    },
    draw: function(){
        var renderer, world, viewWidth, viewHeight;

        viewWidth = this.get('width');
        viewHeight = this.get('height');

        world = new Physics({
            integrator: 'verlet',
            sleepDisabled: true
        });

        renderer = new Physics.renderer('canvas', {
            el: 'physics-canvas',
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

        Physics.util.ticker.on(function(time){
            world.step(time);
        });

        Physics.util.ticker.start();
        this.set('world',world);
    }.on('didInsertElement'),

    _setupInteractions: function(world){
        // world.on('interact:grab', function(data) {
        //
        // })
    },

    _getRandomColor: function () {
        var colorSet = [
            'red',
            'orange',
            'yellow',
            'green',
            'blue',
            'indigo',
            'violet'
        ];
        return colorSet[Math.floor(Math.random() * colorSet.length)];
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
            body.restitution = body.restitution == 1? 0.7 : 1;
        })
        this.set('elasticityOn',!this.get('elasticityOn'));
    },

    actions: {
        speedBodiesUp: function(world){
            var INC = this.get('VELOCITY_INCREMENT');
            var bodies = world.getBodies();
            bodies.forEach(function(body,index){
                var x = body.state.vel.x,
                    y = body.state.vel.y;
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
            })
        },
        slowBodiesDown: function(world){
            var INC = this.get('VELOCITY_INCREMENT');
            var bodies = world.getBodies();
            bodies.forEach(function(body,index){
                var x = body.state.vel.x,
                    y = body.state.vel.y;
                if(x == 0 && y == 0) {
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
                body.state.vel.set(x,y);
            })
        },
        growBodies: function(world) {
            var bodies = world.getBodies();
            bodies.forEach(function(body,index){
                body.radius += 1;
                body.view = undefined;
            })
        },
        shrinkBodies: function(world){
            var bodies = world.getBodies();
            bodies.forEach(function(body,index){
                body.radius -= 1;
            })
        },
        addOneBody: function(world){
            world.add(this._generateBall());
        },
        removeOneBody: function(world) {
            var bodies = world.getBodies();
            if(bodies.length > 0){
                world.removeBody(bodies[0]);
            }
        },
        toggleCollisionDetection: function(world) {
            this.toggleBallCollisions(world);
        },
        pause: function(world) {
            if(world.isPaused()) {
                world.unpause();
                this.set('paused',false);
            }
            else {
                world.pause();
                this.set('paused',true);
            }
        },
        toggleGravity: function(world) {
            this.toggleGravityEffect(world);
        },
        toggleElasticity: function(world) {
            this.toggleElasticBalls(world);
        }
    }

});
