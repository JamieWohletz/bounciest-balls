import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'button',

    mouseDown: function(){
        var self = this;
        this.set('interval',setInterval(function(){
            self.sendAction();
        }, 100));
    },

    mouseUp: function() {
        clearInterval(this.get('interval'));
    },

    click: function(){
        this.sendAction();
    }
});
