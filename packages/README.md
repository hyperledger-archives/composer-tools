# Hyperledger Composer Profile Validation

This is a utility that can be used to validate hyperledger fabric common connection profiles.

## Use it
Since it's not formally released into the npm repository, if you want to use it from the command line then I'd recommend the following steps to get it built/installed.

1. Clone the tools repo using 

```
git clone git@github.com:hyperledger/composer-tools.git
or
git clone https://github.com/hyperledger/composer-tools.git
```

2. Setup the dependencies
First, make sure you have `lerna` installed with `lerna --v`.  If not install it with

```
npm install --global lerna
```

then from the `packages` directory of the cloned repo issue

```
lerna init
lerna bootstrap
```

3. Run the unit tests to make sure all is good.

```
cd composer-validate-profile
npm test
```

4. Create a local NPM package that you can install with

``` 
npm pack
```

5. Install the package with

```
npm install -g composer-validate-profile-0.1.0.tgz
```

6. Test the install 

```
composer-validate-profile
```

Celebrate good times!

## Note
You should see a usage message: `Usage: composer-validate-profile <connection profile filename>`
Note the sneaky option to specify `fabric` as a second parameter which will use a schema for fabric instead.  This is less restrictive than the composer schema and doesn't require all of the same properties to be present. You can check out the differences in the `schema` directory




