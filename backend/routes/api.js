const express = require('express');
const router = express.Router();
const gridController = require('../controllers/gridController');
const mlController = require('../controllers/mlController');

router.get('/overview', gridController.getOverview);
router.get('/forecast', gridController.getForecast);
router.get('/scheduler', gridController.getScheduler);
router.get('/siting', gridController.getSiting);
router.get('/digitalTwin', gridController.getDigitalTwin);
router.get('/alerts', gridController.getAlerts);

router.post('/ml/predict', mlController.predict);
router.post('/ml/optimize', mlController.optimize);
router.post('/ml/hotspots', mlController.hotspots);
router.post('/ml/risk', mlController.risk);

module.exports = router;
