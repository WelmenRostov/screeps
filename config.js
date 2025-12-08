module.exports = {
    positions: {
	// Miner фиксируется на этой позиции (если занято — ищет ближайшую)
	miner: {
	    x: 15,
	    y: 6,
	    room: 'W19N55'
	},

	// Updater фиксируется около этой позиции (если занято — range1)
	updater: {
	    x: 18,
	    y: 15,
	    room: 'W19N55'
	}
    },

    // Структура, откуда роли Nanny и Updater берут энергию
    storageStructure: STRUCTURE_STORAGE
};
