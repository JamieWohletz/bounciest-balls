import Ember from 'ember';
/* global Physics */

export default Ember.Component.extend({
    width: 500,
    height: 500,
    ballDefaults: {
        x: 50,
        y: 50,
        vx: 0,
        vy: 0,
        radius: 20,
        restitution: 1.0,
        cof: 0
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

        world.add(Physics.behavior('body-impulse-response'));
        world.add( Physics.behavior('body-collision-detection') );
        world.add( Physics.behavior('sweep-prune') );
        world.add(Physics.behavior('constant-acceleration'));

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
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++ ) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    },

    actions: {
        speedBodiesUp: function(world){
            var bodies = world.getBodies();
            bodies.forEach(function(body,index){
                var x = body.state.vel.x,
                    y = body.state.vel.y;
                if(x < 0) {
                    x -= .05;
                }
                else {
                    x += .05;
                }
                if(y < 0) {
                    y -= .05;
                }
                else {
                    y += .05;
                }
                body.state.vel.set(x,y);
            })
        },
        slowBodiesDown: function(world){
            var bodies = world.getBodies();
            bodies.forEach(function(body,index){
                var x = body.state.vel.x,
                    y = body.state.vel.y;
                if(x == 0 && y == 0) {
                    return;
                }

                if(x < 0) {
                    x += .05;
                }
                else {
                    x -= .05;
                }
                if(y < 0) {
                    y += .05;
                }
                else {
                    y -= .05;
                }
                body.state.vel.set(x,y);
            })
        },
        growBodies: function(world) {
            var bodies = world.getBodies();
            bodies.forEach(function(body,index){
                console.log(body.geometry);
                body.radius += 1;
            })
        },
        shrinkBodies: function(world){
            var bodies = world.getBodies();
            bodies.forEach(function(body,index){
                body.radius -= 1;
            })
        },
        addOneBody: function(world){
            var ball = Physics.body('circle',this.get('ballDefaults'));
            world.add(ball);
        },
        removeOneBody: function(world) {
            var bodies = world.getBodies();
            if(bodies.length > 0){
                world.removeBody(world.getBodies()[0]);
            }
        }
    }

});
