'use strict';

// Parent Class Workout
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; // [latitude , longitude]
    this.distance = distance; // in KM
    this.duration = duration; // in Minutes
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}, ${this.date.getFullYear()}`;
  }
}

// Running as a child class of Workout
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    // Minutes/Km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// Cycling as a child class of Workout
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    // Km/Hour
    this.speed = this.distance / (this.duration / 60);
    this.speed;
  }
}

// Creating objects
/* const cycle = new Cycling([12, 18], 15, 10, 52);
const run = new Running([12, 18], 8, 15, 32);
console.log(run, cycle); */

// App Architecture
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const resetBtn = document.querySelector('.reset');

// Class App (for Events and Forms)
class App {
  #storageKey = 'workouts';
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    // Current position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // New Marker on Map
    form.addEventListener('submit', this._newWorkout.bind(this));
    //Cycling or Running
    inputType.addEventListener('change', this._toggleElevationField);
    // Moving on click on marker
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    // Reset Local Storage
    resetBtn.addEventListener('click', this.#reset.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
    }
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    // Loading Map
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png').addTo(
      this.#map
    );
    // Handling clicks on Map to show form
    this.#map.on('click', this._showForm.bind(this));

    // Rendering Local storage Markers
    this.#workouts.forEach((work) => this._renderWorkoutMarker(work));
  }
  _showForm(mapEve) {
    this.#mapEvent = mapEve;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    // Clear all fields
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    // Validation of all inputs
    const validInputs = (...inputs) =>
      inputs.every((input) => Number.isFinite(input));

    // All positive check
    const allPositive = (...inputs) => inputs.every((input) => input > 0);

    e.preventDefault();
    // Get type of data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If running then create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Validate data
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Input has to be a Positive Number!');
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If cycling then create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // Validate data
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Input has to be a Positive Number!');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map using marker
    this._renderWorkoutMarker(workout);
    // creating a marker

    // Render workout on List
    this._renderWorkout(workout);

    // Hide from and clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;
    if (workout.type === 'running') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;
    }

    if (workout.type === 'cycling') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;
    }

    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workoutElement = e.target.closest('.workout');
    // Guard Condition
    if (!workoutElement) return;
    const workout = this.#workouts.find(
      (work) => work.id === workoutElement.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  _setLocalStorage() {
    localStorage.setItem(this.#storageKey, JSON.stringify(this.#workouts));
    this._checkReset();
  }
  _getLocalStorage() {
    const workouts = JSON.parse(localStorage.getItem(this.#storageKey));
    if (!workouts) return;
    this.#workouts = workouts;
    this.#workouts.forEach((work) => this._renderWorkout(work));
    this._checkReset();
  }
  _checkReset() {
    if (localStorage.length > 0) resetBtn.classList.remove('form__row--hidden');
  }
  #reset() {
    const yesno = confirm('Are you sure want to reset the Map?');
    if (yesno) {
      localStorage.removeItem(this.#storageKey);
      location.reload();
    }
  }
}

const app = new App();
