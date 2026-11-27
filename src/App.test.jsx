import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

const json = data => ({ ok: true, status: 200, json: async () => data });
const books = [{ id: 1, titulo: 'El túnel', autor: 'Ernesto Sábato', anio: 1948 }];
const songs = [{ id: 2, titulo: 'Te recuerdo Amanda', artista: 'Víctor Jara', anio: 1969, genero: 'Folclor' }];

beforeEach(() => { location.hash = ''; global.fetch = jest.fn().mockResolvedValue(json(books)); });
afterEach(() => { jest.restoreAllMocks(); });

test('muestra los libros obtenidos con fetch y permite buscarlos', async () => {
  render(<App apiUrl="http://localhost:8000/api" />);
  expect(screen.getByRole('status')).toHaveTextContent('Cargando colección');
  expect(await screen.findByText('El túnel')).toBeInTheDocument();
  expect(screen.getByText('Ernesto Sábato')).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/libros/', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'inexistente' } });
  expect(screen.getByText('No encontramos resultados')).toBeInTheDocument();
});

test('cambia a canciones y muestra datos reales de la otra API', async () => {
  global.fetch = jest.fn(url => Promise.resolve(json(url.includes('canciones') ? songs : books)));
  render(<App apiUrl="/api" />);
  expect(await screen.findByText('El túnel')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Canciones/ }));
  expect(await screen.findByText('Te recuerdo Amanda')).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith('/api/canciones/', expect.any(Object));
});

test('muestra un error cuando el backend falla', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ detail: 'Servicio no disponible' }) });
  render(<App apiUrl="/api" />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Servicio no disponible');
});

test('crea un libro y vuelve a consultar el listado', async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce(json([]))
    .mockResolvedValueOnce({ ok: true, status: 201, json: async () => books[0] })
    .mockResolvedValueOnce(json(books));
  render(<App apiUrl="/api" />);
  expect(await screen.findByText('Todavía no hay libros')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Añadir libro' }));
  fireEvent.change(screen.getByLabelText('Título *'), { target: { value: 'El túnel' } });
  fireEvent.change(screen.getByLabelText('Autor *'), { target: { value: 'Ernesto Sábato' } });
  fireEvent.change(screen.getByLabelText('Año *'), { target: { value: '1948' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar libro' }));
  expect(await screen.findByText('El túnel')).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith('/api/libros/', expect.objectContaining({ method: 'POST', body: JSON.stringify({ titulo: 'El túnel', autor: 'Ernesto Sábato', anio: 1948 }) }));
});
