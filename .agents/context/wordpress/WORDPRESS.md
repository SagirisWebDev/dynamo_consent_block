
## Menus
- Always register a primary nav menu with the fallback callback set to false when creating a greenfield theme

## Javascript
- pass all relevant overside PHP data into the JavaScript using WP_localized_script. use the corresponding data as an array in the JavaScript. Use apply filters function ass the Object_name in the WP_localized_script function and pass in provided array as the default. This allows, the end user to override our provided defaults to the WP_localized_script function.
- don't use ECMAScript syntax for admin pages, common JS has to be used.

## Styling
- enqueue all stylesheets or if applicable, append all static stylesheets to dynamically generated css, DO NOT OVERWRITE THE DYNAMIC CSS WITH THE STATIC STYLESHEET DECLARATIONS, APPEND THEM.

## Classes
- put the @package and @since PHPDoc tags at the start of every class definition file
- include an ABSPATH escape so the file can't be accessed directly from the front end, eg.
```php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}
```
- if the class is meant to be instantiated, add this public static function to the class:
```php
public static function get_instance() {
  if ( ! isset( self::$instance ) ) {
    self::$instance = new self();
  }
  return self::$instance;
}
```
- each variable in a class definition needs to have a @var PHPDoc tag and it's corresponding data type
- each method in a class definition need to have a @since tag with the version the method was added, a @params tag with a list of all the parameter types the function is meant to take along with a handle to be used in the function definition, and if applicable a @return tag if the method returns a value.