import Ref from 'html-tag-js/ref';
import {
  $footer,
  $input,
  $toggler,
  Row,
  SearchRow1,
  SearchRow2,
} from './footer';
import { setRef } from './items';
import settings from 'lib/settings';


/**@type {HTMLElement} */
let $row1;
/**@type {HTMLElement} */
let $row2;
/**@type {HTMLElement} */
let $searchRow1;
/**@type {HTMLElement} */
let $searchRow2;


const $searchInput = new Ref();
const $replaceInput = new Ref();
const $searchPos = new Ref();
const $searchTotal = new Ref();
const $shift = new Ref();
const $ctrl = new Ref();
const $save = new Ref();
const $alt = new Ref();
const $meta = new Ref();

setRef("save", $save);
setRef("ctrl", $ctrl);
setRef("shift", $shift);
setRef("alt", $alt);
setRef("meta", $meta);

export default {
  get $footer() {
    return $footer;
  },
  get $row1() {
    if ($row1) return $row1;
    $row1 = <Row row={1} />;

    settings.on('update:quicktoolsItems:after', () => {
      $row1 = <Row row={1} />;
    });

    return $row1;
  },
  get $row2() {
    if ($row2) return $row2;
    $row2 = <Row row={2} />;

    settings.on('update:quicktoolsItems:after', () => {
      $row2 = <Row row={2} />;
    });

    return $row2;
  },
  get $searchRow1() {
    if ($searchRow1) return $searchRow1;
    $searchRow1 = <SearchRow1 inputRef={$searchInput} />;
    return $searchRow1;
  },
  get $searchRow2() {
    if ($searchRow2) return $searchRow2;
    $searchRow2 = <SearchRow2 inputRef={$replaceInput} posRef={$searchPos} totalRef={$searchTotal} />;
    return $searchRow2;
  },
  get $input() {
    return $input;
  },
  get $toggler() {
    return $toggler;
  },
  get $searchInput() {
    return $searchInput;
  },
  get $replaceInput() {
    return $replaceInput;
  },
  get $searchPos() {
    return $searchPos;
  },
  get $searchTotal() {
    return $searchTotal;
  },
  get $shift() {
    return $shift;
  },
  get $ctrl() {
    return $ctrl;
  },
  get $alt() {
    return $alt;
  },
  get $meta() {
    return $meta;
  },
  get $save() {
    return $save;
  }
};
