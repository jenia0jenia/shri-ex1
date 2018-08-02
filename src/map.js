import { loadList, loadDetails } from './api';
import { getDetailsContentLayout } from './details';
import { createFilterControl } from './filter';

export default function initMap(ymaps, containerId) {
  const myMap = new ymaps.Map(containerId, {
    center: [55.76, 37.64],
    controls: [],
    zoom: 10
  });

  const objectManager = new ymaps.ObjectManager({
    clusterize: true,
    gridSize: 64,

    clusterIconLayout: 'default#pieChart',
    clusterDisableClickZoom: false,

    geoObjectOpenBalloonOnClick: false,
    geoObjectHideIconOnBalloonOpen: false,
    geoObjectBalloonContentLayout: getDetailsContentLayout(ymaps)
  });

  objectManager.clusters.options.set('preset', 'islands#greenClusterIcons');

  // cluster add
  objectManager.clusters.events.add('add', (event) => {
    const clusterId = event.get('objectId');
    const cluster = objectManager.clusters.getById(clusterId);
    const objects = cluster.properties.geoObjects;
    let hasDefective = false;

    objects.some((obj) => {
      if (!obj.isActive) {
        hasDefective = true;
      }
      return hasDefective;
    });

    if (hasDefective) {
      objectManager.clusters.setClusterOptions(clusterId, {
        preset: 'islands#orangeClusterIcons'
      });
    }
  });

  // balloon click
  objectManager.objects.events.add('click', event => {
    const objectId = event.get('objectId');
    const obj = objectManager.objects.getById(objectId);

    objectManager.objects.balloon.open(objectId);

    if (!obj.properties.details) {
      loadDetails(objectId).then(data => {
        obj.properties.details = data;
        objectManager.objects.balloon.setData(obj);
      });
    }
  });

  loadList().then(data => {
    objectManager.add(data);
  });

  // filters
  const listBoxControl = createFilterControl(ymaps);
  myMap.controls.add(listBoxControl);

  var filterMonitor = new ymaps.Monitor(listBoxControl.state);
  filterMonitor.add('filters', filters => {
    objectManager.setFilter(
      obj => filters[obj.isActive ? 'active' : 'defective']
    );
  });

  myMap.geoObjects.add(objectManager);
}