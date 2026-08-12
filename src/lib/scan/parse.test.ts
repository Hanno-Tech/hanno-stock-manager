import { describe, expect, it } from 'vitest';
import { parseScan } from './parse';

describe('parseScan', () => {
  it('devolve o código de barras cru intacto', () => {
    expect(parseScan('ML-987234-A')).toEqual({
      kind: 'RAW',
      value: 'ML-987234-A',
      raw: 'ML-987234-A',
    });
  });

  it('extrai só o id do QR da etiqueta', () => {
    const raw = '{"id":"44521978231","senderId":998,"type":"forward"}';
    expect(parseScan(raw)).toMatchObject({ kind: 'ID', value: '44521978231' });
  });

  it('aceita id numérico sem perder dígitos', () => {
    expect(parseScan('{"id":44521978231}')).toMatchObject({
      kind: 'ID',
      value: '44521978231',
    });
  });

  it('extrai o phrase do QR que o cliente apresenta na retirada', () => {
    const raw = '{"phrase":"UNIVERSO.796520","extraData":null}';
    expect(parseScan(raw)).toMatchObject({ kind: 'PHRASE', value: 'UNIVERSO.796520' });
  });

  it('prefere id a phrase quando os dois vêm no mesmo payload', () => {
    const raw = '{"phrase":"UNIVERSO.1","id":"999"}';
    expect(parseScan(raw)).toMatchObject({ kind: 'ID', value: '999' });
  });

  it('não confunde código de barras numérico com JSON', () => {
    // JSON.parse('796520') devolve um number — sem a guarda viraria payload.
    expect(parseScan('796520')).toMatchObject({ kind: 'RAW', value: '796520' });
  });

  it('não engole JSON de formato desconhecido', () => {
    const raw = '{"foo":"bar"}';
    expect(parseScan(raw)).toMatchObject({ kind: 'RAW', value: raw });
  });

  it('ignora id/phrase vazios ou não escalares', () => {
    expect(parseScan('{"id":"   ","phrase":"UNIVERSO.5"}')).toMatchObject({
      kind: 'PHRASE',
      value: 'UNIVERSO.5',
    });
    expect(parseScan('{"id":{"a":1},"phrase":"UNIVERSO.6"}')).toMatchObject({
      kind: 'PHRASE',
      value: 'UNIVERSO.6',
    });
  });

  it('apara espaços em volta do payload', () => {
    expect(parseScan('  {"phrase":"UNIVERSO.7"}  ')).toMatchObject({
      kind: 'PHRASE',
      value: 'UNIVERSO.7',
    });
  });

  it('trata leitura vazia sem quebrar', () => {
    expect(parseScan('   ')).toMatchObject({ kind: 'RAW', value: '' });
  });
});
