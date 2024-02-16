import tensorflow_datasets as tfds

# Load the EMNIST dataset
builder = tfds.builder('emnist/byclass')
builder.download_and_prepare()
info = builder.info

# Print the class names
print(info.features['label'].names)