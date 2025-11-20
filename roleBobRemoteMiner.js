const creepMovement = require('./creepMovement');

let roleBobRemoteMiner = {
    run: function(creep) {
        const targetRoom = creep.memory.targetRoom || 'W22N56';

        if (creep.room.name !== targetRoom) {
            creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                reusePath: 10,
                visualizePathStyle: { stroke: '#ffaa00' }
            });
            return;
        }

        creep.memory.role = 'bobLocalMiner';
    }
};

module.exports = roleBobRemoteMiner;
