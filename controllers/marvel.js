import MarvelApiService from '../models/marvel.js';

export default async (req, res, next) => {
  const searchQuery = new URLSearchParams(req.query);
  let isSearchQueryValid = false;

  if (searchQuery.toString().length === 0) {
    return res.render('marvel/marvel', {
      pageTitle: 'Marvel Universe',
      path: '/marvel',
      isSearchQuery: false,
      isSearchQueryValid: isSearchQueryValid,
    });

  } else if (!searchQuery.has('name') && !searchQuery.has('character-id') && !searchQuery.has('comics-id')) {
    return res.render('marvel/marvel', {
      pageTitle: 'Marvel Universe',
      path: '/marvel',
      isSearchQuery: true,
      isSearchQueryValid: isSearchQueryValid,
      errorMessage: 'Invalid search query!'
    });

  } else if (searchQuery.has('name')) {
    let characterData, comicsData;
    try {
      characterData = await MarvelApiService.getSingleCharacterWithName(req.query.name);
      if (!characterData) {
        return res.render('marvel/marvel', {
          pageTitle: 'Marvel Universe',
          path: '/marvel',
          isSearchQuery: true,
          isSearchQueryValid: isSearchQueryValid,
          errorMessage: `Currently we can't provide results for character with name: ${req.query.name}. Sorry for the inconvenience.`
        });
      }

      isSearchQueryValid = characterData.data.code !== 404 && characterData.data.data.count && characterData.data.data.count > 0;
      if (isSearchQueryValid) {
        try {
          comicsData = await MarvelApiService.getSingleCharacterComics(characterData.data.data.results[0].id);
          return res.render('marvel/marvel', {
            pageTitle: 'Marvel Universe',
            path: '/marvel',
            isSearchQuery: true,
            isSearchQueryValid: isSearchQueryValid,
            character: characterData.data.data.results[0],
            comics: comicsData.data.data.results,
            attributionHTML: characterData.data.attributionHTML,
            characterHyperlinkToMarvel: characterData.data.data.results[0].urls[0].url.split('?')[0],
            render: 'character'
          });
        } catch (err) {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        }
      } else {
        return res.render('marvel/marvel', {
          pageTitle: 'Marvel Universe',
          path: '/marvel',
          isSearchQuery: true,
          isSearchQueryValid: isSearchQueryValid,
          errorMessage: 'Please enter valid and full Character Name'
        });
      }
    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }

  } else if (searchQuery.has('character-id')) {
    let characterData, comicsData;
    try {
      characterData = await MarvelApiService.getSingleCharacterWithId(req.query['character-id']);
      if (!characterData) {
        return res.render('marvel/marvel', {
          pageTitle: 'Marvel Universe',
          path: '/marvel',
          isSearchQuery: true,
          isSearchQueryValid: isSearchQueryValid,
          errorMessage: `Currently we can't provide results for character with ID: ${req.query['character-id']}. Sorry for the inconvenience.`
        });
      }

      isSearchQueryValid = characterData.data.code === 200 && characterData.data.data.count > 0;
      if (isSearchQueryValid) {
        try {
          comicsData = await MarvelApiService.getSingleCharacterComics(characterData.data.data.results[0].id);
          return res.render('marvel/marvel', {
            pageTitle: 'Marvel Universe',
            path: '/marvel',
            isSearchQuery: true,
            isSearchQueryValid: isSearchQueryValid,
            character: characterData.data.data.results[0],
            comics: comicsData.data.data.results,
            attributionHTML: characterData.data.attributionHTML,
            characterHyperlinkToMarvel: characterData.data.data.results[0].urls[0].url.split('?')[0],
            render: 'character'
          });
        } catch (err) {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        }
      } else {
        return res.render('marvel/marvel', {
          pageTitle: 'Marvel Universe',
          path: '/marvel',
          isSearchQuery: true,
          isSearchQueryValid: isSearchQueryValid,
          errorMessage: 'Invalid Character ID!'
        });
      }
    } catch (err) {
      if (err.message === 'Request failed with status code 404') {
        return res.render('marvel/marvel', {
          pageTitle: 'Marvel Universe',
          path: '/marvel',
          isSearchQuery: true,
          isSearchQueryValid: isSearchQueryValid,
          errorMessage: 'Invalid Character ID!'
        });
      } else {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      }
    }

  } else if (searchQuery.has('comics-id')) {
    let comicData, charactersData;
    try {
      comicData = await MarvelApiService.getSingleComics(req.query['comics-id']);
      if (!comicData) {
        return res.render('marvel/marvel', {
          pageTitle: 'Marvel Universe',
          path: '/marvel',
          isSearchQuery: true,
          isSearchQueryValid: isSearchQueryValid,
          errorMessage: `Currently we can't provide results for comics with ID: ${req.query['comics-id']}. Sorry for the inconvenience.`
        });
      }

      isSearchQueryValid = comicData.data.code === 200 && comicData.data.data.count > 0;
      if (isSearchQueryValid) {
        try {
          charactersData = await MarvelApiService.getSingleComicsCharacters(comicData.data.data.results[0].id);
          return res.render('marvel/marvel', {
            pageTitle: 'Marvel Universe',
            path: '/marvel',
            isSearchQuery: true,
            isSearchQueryValid: isSearchQueryValid,
            comic: comicData.data.data.results[0],
            characters: charactersData.data.data.results,
            attributionHTML: comicData.data.attributionHTML,
            comicHyperlinkToMarvel: comicData.data.data.results[0].urls[0].url.split('?')[0],
            render: 'comics'
          });
        } catch (err) {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        }
      } else {
        return res.render('marvel/marvel', {
          pageTitle: 'Marvel Universe',
          path: '/marvel',
          isSearchQuery: true,
          isSearchQueryValid: isSearchQueryValid,
          errorMessage: 'Invalid Comics ID!'
        });
      }
    } catch (err) {
      if (err.message === 'Request failed with status code 404') {
        return res.render('marvel/marvel', {
          pageTitle: 'Marvel Universe',
          path: '/marvel',
          isSearchQuery: true,
          isSearchQueryValid: isSearchQueryValid,
          errorMessage: 'Invalid Comics ID!'
        });
      } else {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      }
    }
  }
};
