import axios from 'axios';
import md5 from 'md5';

export default class MarvelApiService {
  static createHashString = () => {
    const timestamp = new Date().toISOString();
    const hashString = md5(`${timestamp}${process.env.MARVEL_API_PRIVATE_KEY}${process.env.MARVEL_API_PUBLIC_KEY}`);
    return `?ts=${timestamp}&apikey=${process.env.MARVEL_API_PUBLIC_KEY}&hash=${hashString}`;
  };

  static getSingleCharacterWithName = async (name) => {
    const response = await axios.get(`${process.env.MARVEL_API_BASE_URL}characters${this.createHashString()}&name=${name}`);
    return response;
  };

  static getSingleCharacterWithId = async (characterId) => {
    const response = await axios.get(`${process.env.MARVEL_API_BASE_URL}characters/${characterId}${this.createHashString()}`);
    return response;
  };

  static getSingleCharacterComics = async (characterId) => {
    const response = await axios.get(`${process.env.MARVEL_API_BASE_URL}characters/${characterId}/comics${this.createHashString()}`);
    return response;
  };

  static getSingleComics = async (comicsId) => {
    const response = await axios.get(`${process.env.MARVEL_API_BASE_URL}comics/${comicsId}${this.createHashString()}`);
    return response;
  };

  static getSingleComicsCharacters = async (comicsId) => {
    const response = await axios.get(`${process.env.MARVEL_API_BASE_URL}comics/${comicsId}/characters${this.createHashString()}`);
    return response;
  };
};
