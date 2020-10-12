import {fromEvent, EMPTY} from 'rxjs'

import {
	map,
	debounceTime,
	distinctUntilChanged,
	switchMap,
	mergeMap,
	tap,
	catchError,
	filter
} from 'rxjs/operators'

// Позволяет делать асинхронные запросы, которые обёрнуты в стрим
import {ajax} from 'rxjs/ajax'

const url = 'https://api.github.com/search/users?q='

const search = document.getElementById('search');
const result = document.getElementById('result');

// С помощью fromEvent создаем поток при возникновении пользовательского события input на базе элемента search.
// Таким образом, при каждом введении нового символа - мы будем получать из потока объект события.
const stream$ = fromEvent(search, 'input')
	.pipe(
		// map - преобразовывает значение потока с помощью ф-ции, которую принимает в качестве параметра.
		// Всегда должна возвращать значение:
		map(event => event.target.value),

		// debounceTime - возвращает значение из потока, если по прошествии заданного промежутка времени не появились новые значения: 
		debounceTime(1000),

		// distinctUntilChanged - возвращает значение из потока, только тогда, когда текущее значение отличается от последнего:
		distinctUntilChanged(),

		// tap() - используется для выполнения какого-либо действия при генерации объектом Observable нового значения; не изменяет исходного значения.
		tap(() => {
			result.innerHTML = '';
		}),

		// filter() - фильтрует значение из Observable на основе заданной функции-параметра. Если условие ложно - следующий за filter() оператор не будет выполнен.
		filter((value) => {
			value => value.trim();
			return value;
		}),

		// Сейчас мы находимся в потоке, который создан на базе события, а чтобы сделать запрос с помощью 'rxjs/ajax', нам необходимо переключиться на стрим который делает запрос на сервер. Для этого воспользуемся switchMap.
		// switchMap - позволяет переключиться на другой стрим; параметром принимает значение value из стрима выше 
		switchMap(value => ajax.getJSON(url + value).pipe(
			// EMPTY - пустой обозреватель, который моментально завершается, не возвратив ни одного значения
			catchError(error => EMPTY)
		)),

		// Избавляемся от ненужных полей
		map(response => response.items),

		// Здесь мы получаем массив объектов и subscribe подписчика сработает один раз, получив этот массив.
		// Но нам нужно, чтобы subscribe сработал на каждом елементе массива, так как внутри subscribe генерируются карточки.
		// Для этого воспользуемся методом mergeMap() - он вызывает переданную в него функцию, которая генерирует новый поток из елементов.
		// !!! mergeMap является псевдонимом flatMap
		mergeMap(items => items)
	)

// Подписываемся на стрим 
stream$.subscribe(user => {
	console.log(user);
  const html = `
    <div class="card">
      <div class="card-image">
        <img src="${user.avatar_url}" />
        <span class="card-title">${user.login}</span>
      </div>
      <div class="card-action">
        <a href="${user.html_url}" target="_blank">Открыть github</a>
      </div>
    </div>
  `
  result.insertAdjacentHTML('beforeend', html);
})

// =========================
// Туториалы:
// =========================

// https://medium.com/@toshabely/rxjs-%D1%81-%D0%BD%D1%83%D0%BB%D1%8F-%D0%BE%D0%B1%D0%B7%D0%BE%D1%80-%D0%BE%D0%B1%D0%BE%D0%B7%D1%80%D0%B5%D0%B2%D0%B0%D1%82%D0%B5%D0%BB%D1%8F-ca4d8e5fb386