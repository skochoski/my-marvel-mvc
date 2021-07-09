import MarvelApiService from '../models/marvel.js';
import Post from '../models/post.js';

export default async (req, res, next) => {
  let errorMessage = req.flash('error');
  if (errorMessage.length > 0) {
    errorMessage = errorMessage[0];
  } else {
    errorMessage = null;
  }

  let infoMessage = req.flash('info');
  if (infoMessage.length > 0) {
    infoMessage = infoMessage[0];
  } else {
    infoMessage = null;
  }

  try {
    const [ characterData, comicsData, comicData, charactersData, post ] = await Promise.all([
      MarvelApiService.getSingleCharacterWithId('1009220'),
      MarvelApiService.getSingleCharacterComics('1009220'),
      MarvelApiService.getSingleComics('7849'),
      MarvelApiService.getSingleComicsCharacters('7849'),
      Post.find().sort({ commentsCount: -1 }).limit(1)
    ]);
    const comments = post[0]?.comments.length > 0 ? post[0].comments.reverse() : [];

    res.render('home/home', {
      pageTitle: 'My Marvel',
      path: '/',
      errorMessage: errorMessage,
      infoMessage: infoMessage,
      character: characterData.data.data.results[0],
      comics: comicsData.data.data.results,
      attributionHTML: characterData.data.attributionHTML,
      characterHyperlinkToMarvel: characterData.data.data.results[0].urls[0].url.split('?')[0],
      comic: comicData.data.data.results[0],
      characters: charactersData.data.data.results,
      comicHyperlinkToMarvel: comicData.data.data.results[0].urls[0].url.split('?')[0],
      post: post[0],
      comments: comments
    });

  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
