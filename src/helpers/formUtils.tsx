import { ChangeEventHandler } from 'react';

export function saveToLocalStorage(key: string, value: string) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function handleChange(key: string, value: string, setter: Function) {
  saveToLocalStorage(key, value);
  setter(value);
}

export function renderInputGroup(
  name: string,
  label: string,
  placeholder: string,
  stateVariable: string,
  onChangeFn: ChangeEventHandler,
  optionalArgs?: { [key: string]: any }
) {
  var hasList = optionalArgs?.list && optionalArgs.list.length > 0;
  return (
    <>
      <label htmlFor={name} className="block text-sm font-medium leading-6 text-gray-900">
        {label}
      </label>
      <div className="mt-2 relative rounded-md shadow-sm">
        <input
          type={optionalArgs?.type || 'text'}
          name={name}
          className="block w-full rounded-md border-0 px-4 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          placeholder={placeholder}
          value={stateVariable}
          onChange={onChangeFn}
          list={hasList ? `${name}-data-list` : ''}
        />
      </div>
      {hasList ? <datalist id={`${name}-data-list`}>{optionalArgs?.list}</datalist> : ''}
      {optionalArgs?.footnote ? <p className="mt-2 text-xs ml-0 text-gray-500">{optionalArgs?.footnote}</p> : ''}
    </>
  );
}
