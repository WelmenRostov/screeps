// ====== MOVE SYSTEM (Ultra Low CPU Version A) ======

let MoveSystem = {

    move: function(creep, target, opts = {}) {

	if (!creep.memory._moveData) {
	    creep.memory._moveData = {};
	}

	// ----------------------------
	// USE PATH CACHE
	// ----------------------------
	if (!creep.memory._moveData.path || creep.memory._moveData.target !== this._targetId(target)) {
	    let path = creep.pos.findPathTo(target, {
		ignoreCreeps: true,
		maxOps: 2000,
		range: opts.range || 1
	    });

	    creep.memory._moveData.path = Room.serializePath(path);
	    creep.memory._moveData.target = this._targetId(target);
	}

	// ----------------------------
	// FOLLOW PATH
	// ----------------------------
	let code = creep.moveByPath(creep.memory._moveData.path);

	// If blocked — rebuild path
	if (code === ERR_NOT_FOUND || code === ERR_INVALID_ARGS) {
	    creep.memory._moveData.path = null;
	}

	return code;
    },

    // get unique identifier for target
    _targetId(target) {
	return target.id || `${target.pos.x}:${target.pos.y}:${target.pos.roomName}`;
    }
};

module.exports = MoveSystem;
